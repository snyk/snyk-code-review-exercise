import { RequestHandler } from 'express';
import { maxSatisfying } from 'semver';
import got from 'got';
import { NPMPackage } from './types';

// review: I would suggest to move this type to a separate file, designated for types.
type Package = { version: string; dependencies: Record<string, Package> };

/**
 * Attempts to retrieve package data from the npm registry and return it
 */
export const getPackage: RequestHandler = async function (req, res, next) {
  // review: These parameters should be validated before using them. At the very least, they should be checked for being non-empty strings.
  const { name, version } = req.params;

  // review: this should be part of the response object, so it should have a type definition.
  const dependencyTree = {};
  try {
    // review: Please check if the npm registry has any rate limiting in place.
    const npmPackage: NPMPackage = await got(
        // review: consider extracting this URL to an environment variable
      `https://registry.npmjs.org/${name}`,
    ).json();

    const dependencies: Record<string, string> =
      npmPackage.versions[version].dependencies ?? {};
    for (const [name, range] of Object.entries(dependencies)) {
      // review: we can use Promise.all to fetch all dependencies concurrently, instead of sequentially.
      const subDep = await getDependencies(name, range);
      dependencyTree[name] = subDep;
    }

    return res
      .status(200)
      .json({ name, version, dependencies: dependencyTree });
  } catch (error) {
    // review: there's no error middleware that is able to handle this error and respond to the client accordingly. Please add one.
    return next(error);
  }
};

// review: There is no caching in place for the results of this function. This is a performance bottleneck for packages with many dependencies.
async function getDependencies(name: string, range: string): Promise<Package> {
  // idea: This function could be memoized to avoid fetching the same package multiple times. Or we could use got's caching feature.
  // review: This fetch is already done in getPackage, we should avoid having duplicate code.
  const npmPackage: NPMPackage = await got(
    `https://registry.npmjs.org/${name}`,
  ).json();

  const v = maxSatisfying(Object.keys(npmPackage.versions), range);
  const dependencies: Record<string, Package> = {};

  if (v) {
    const newDeps = npmPackage.versions[v].dependencies;
    for (const [name, range] of Object.entries(newDeps ?? {})) {
      // review: since this is a dependency graph, we might run into circular dependencies. There's no guarantee that this function will terminate. We need a better way to solve this.
      dependencies[name] = await getDependencies(name, range);
    }
  }

  return { version: v ?? range, dependencies };
}
