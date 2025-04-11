/* eslint-disable space-before-blocks */
import { RequestHandler } from 'express';
import { maxSatisfying } from 'semver';
import got from 'got';
import { NPMPackage } from './types';

type Package = { version: string; dependencies: Record<string, Package> };
// idea: since npm has multiple packages to traverse through, it might be worth
// adding cache. we can also add TTL to cache, such as npmCache
// Can we check the occurrence of package updates for minimum update time. we can set TTL to below
// to be on the conservative side

// idea: document unexpected things for readability.jsdoc? @params
// idea: design patterns, algorithm, efficient. 
// follow up.

/**
 * Attempts to retrieve package data from the npm registry and return it
 */
export const getPackage: RequestHandler = async function (req, res, next) {
  const { name, version } = req.params;
  const dependencyTree = {};
  try {
    // review: maybe we can check the version and name exists before making a call
    // an edge case for us to check beforehand
    // for readability, what do you think(wdyt) of moving this url to a constant file?
    // will it be used somewhere else? If so, we'll be DRY also. 
    const npmPackage: NPMPackage = await got(
      `https://registry.npmjs.org/${name}`,
    ).json();

    const dependencies: Record<string, string> =
      npmPackage.versions[version].dependencies ?? {};
    // idea: if we find a cache implementation, here we can check cache first

    for (const [name, range] of Object.entries(dependencies)) {
      const subDep = await getDependencies(name, range);
      dependencyTree[name] = subDep;
    }
    // review: do we see timeouts when we make these calls? What's the avarage number
    // let's set a timeout range for that average. If timeout, then we can return error
    // Do we want to retry these calls. I mostly saw retries of three, as a starting point
    // overall timeout currently is 1000, that's th
    return res
      .status(200)
      .json({ name, version, dependencies: dependencyTree });
  } catch (error) {
    // review: error types?
    // timeout errors specific errorTypes
    // logs and monitoring capabilites
    // everything else throw
    return next(error);
  }
};

// idea: circular dependencies? seenPackages map or a Set in Js. 
// depends on time or space needs- either map or Set

// const Interface set {
//   version: number
//   name: string
// }

type Visited = Record<string, string[]>
// {
//   express: [2, 3],
//   axios
// }
// express.2
// express.3
// idea: since npm has multiple packages to traverse through, it might be 
async function getDependencies(name: string, range: string, visited?: Visited ): Promise<Package> {
  // review: in const
  visited = visited ?? {}
  // checkif in set move on
  // unit test
  if(Object.keys(visited).includes(name)){
    // return here
    // check array for the version
    visited[name].includes(range)
    return  { version: range, dependencies: {} }
  } else{
  const npmPackage: NPMPackage = await got(
    `https://registry.npmjs.org/${name}`,
  ).json();
  
  const v = maxSatisfying(Object.keys(npmPackage.versions), range);

  // review: not satisfying?
  // edge case check is that version exists
  const dependencies: Record<string, Package> = {};
  
  // idea: async or batch calls 
  // concurrent call 
  // batch & fail
  // - backward compatibility
  // SOR - check? 

  // idea: error hash or set idea. 
  // monitor and improve over time
  if (v) {
    const newDeps = npmPackage.versions[v].dependencies;
    for (const [name, range] of Object.entries(newDeps ?? {})) {
      dependencies[name] = await getDependencies(name, range, visited);
    }
  }

  return { version: v ?? range, dependencies };
}
}
