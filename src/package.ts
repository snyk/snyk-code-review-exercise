import { RequestHandler } from 'express';
import { maxSatisfying } from 'semver';
import got from 'got';
import { NPMPackage } from './types';

type Package = { version: string; dependencies: Record<string, Package> };

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
      const subDep = await getDependencies(name, range);
      dependencyTree[name] = subDep;
    }

    return res
      .status(200)
      .json({ name, version, dependencies: dependencyTree });
  } catch (error) {
    return next(error);
  }
};

async function getDependencies(name: string, range: string): Promise<Package> {
  const npmPackage: NPMPackage = await got(
    `https://registry.npmjs.org/${name}`,
  ).json();

  const v = maxSatisfying(Object.keys(npmPackage.versions), range);
  const dependencies: Record<string, Package> = {};

  if (v) {
    const newDeps = npmPackage.versions[v].dependencies;
    for (const [name, range] of Object.entries(newDeps ?? {})) {
      dependencies[name] = await getDependencies(name, range);
    }
  }

  return { version: v ?? range, dependencies };
}
