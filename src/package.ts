import { RequestHandler } from 'express';
import { maxSatisfying } from 'semver';
import got from 'got';
import { NPMPackage } from './types';

type Package = { version?: string; dependencies?: Record<string, Package> };

/**
 * Attempts to retrieve package data from the npm registry and return it
 */
export const getPackage: RequestHandler = async function (req, res, next) {
  const { name, version } = req.params;
  const dependencyTree = {};
  try {
    const npmPackage: NPMPackage = await got(
      `https://registry.npmjs.org/${name}`,
    ).json();

    const dependencies: Record<string, string> =
      npmPackage.versions[version].dependencies ?? {};
    for (const [name, range] of Object.entries(dependencies)) {
      const set: Set<[string, string]> = new Set()
      const s = set.add([name, range])
      const subDep = await getDependencies(name, range, s);

      console.log(`the subDep is ${subDep}`)

      dependencyTree[name] = subDep;
    }

    return res
      .status(200)
      .json({ name, version, dependencies: dependencyTree });
  } catch (error) {
    return next(error);
  }
};

// If there is circular dep (A -> B -> A) it will cause an infinite loop
// Potential ways to resolve: 1. Add a set - check set if dependency has already been scanned
// Arrange:
// Set - Object
// Set contents - Package name (K), package versions. 
// Array[String, String]
// Check if package name is in the set
// Check if package version is in the set
// Unhappy path: make call to database
// Store response in the set


async function getDependencies(name: string, range: string, visitedPackages: Set<[string, string]>): Promise<Package> {
  const pg: [string, string] = [name, range]
  if (visitedPackages.has(pg)) {
    console.log("already found package ${package} in visited set") 

    return {} 
  } 

  const npmPackage: NPMPackage = await got(
    `https://registry.npmjs.org/${name}`,
  ).json();

  const v = maxSatisfying(Object.keys(npmPackage.versions), range);
  const dependencies: Record<string, Package> = {};

  if (v) {
    const newDeps = npmPackage.versions[v].dependencies;
    visitedPackages.add([name, v])
    for (const [name, range] of Object.entries(newDeps ?? {})) {
      dependencies[name] = await getDependencies(name, range, visitedPackages);
    }
  }

  return { version: v ?? range, dependencies };
}
