/* eslint-disable @typescript-eslint/ban-types */
import { RequestHandler } from 'express';
import { maxSatisfying } from 'semver';
import got from 'got';
import type { GetPackageResult, NPMPackage, Package } from './types';

const packageCache: Record<string, GetPackageResult> = {};
const dependencyCache: Record<string, Package | {}> = {};
const processingDependencies = new Set<string>();

async function resolveDependencies(
  dependencies: Record<string, string>,
): Promise<Record<string, Package | {}>> {
  const dependencyTree: Record<string, Package | {}> = {};
  const depsPromises = Object.entries(dependencies).map(
    async ([name, range]) => {
      if (processingDependencies.has(name)) {
        return { name, subDep: {} };
      }
      processingDependencies.add(name);
      const subDep = await getDependencies(name, range);

      const result = { name, subDep };

      return result;
    },
  );

  const resolvedDeps = await Promise.all(depsPromises);

  resolvedDeps.forEach(({ name, subDep }) => {
    dependencyTree[name] = subDep;
  });

  return dependencyTree;
}

/**
 * Attempts to retrieve package data from the npm registry and return it
 */
export const getPackage: RequestHandler = async function (req, res, next) {
  const { name, version } = req.params;

  try {
    const cacheKey = `${name}@${version}`;

    if (packageCache[cacheKey]) {
      console.log('Cache hit', cacheKey);
      return res.status(200).json(packageCache[cacheKey]);
    }

    const npmPackage: NPMPackage = await got(
      `https://registry.npmjs.org/${name}`,
    ).json();

    console.log('packageName', npmPackage.name);

    const dependencies: Record<string, string> =
      npmPackage.versions[version].dependencies ?? {};

    console.log('dependencies', dependencies);
    const dependencyTree = await resolveDependencies(dependencies);

    const result: GetPackageResult = {
      name,
      version,
      dependencies: dependencyTree,
    };

    console.log('Feeding cache', cacheKey);
    packageCache[cacheKey] = result;

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: JSON.stringify(error) });
  }
};

async function getDependencies(
  name: string,
  range: string,
): Promise<Package | {}> {
  const cacheKey = `${name}@${range}`;
  if (dependencyCache[cacheKey]) {
    console.log('Cache hit', cacheKey);
    return dependencyCache[cacheKey];
  }

  const npmPackage: NPMPackage = await got(
    `https://registry.npmjs.org/${name}`,
  ).json();

  const v = maxSatisfying(Object.keys(npmPackage.versions), range);
  let dependencies: Record<string, Package | {}> = {};

  if (v) {
    const newDeps = npmPackage.versions[v].dependencies ?? {};
    dependencies = await resolveDependencies(newDeps);
  }

  const result = { version: v ?? range, dependencies };

  console.log('Feeding cache', cacheKey);
  dependencyCache[cacheKey] = result;

  return result;
}
