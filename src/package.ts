import { RequestHandler } from 'express';
import { maxSatisfying } from 'semver';
import got from 'got';
import { NPMPackage } from './types';

/**
 * Attempts to retrieve package data from the npm registry and return it
 */
export const getPackage: RequestHandler = async function (req, res, next) {
  const { name, version } = req.params;

  try {
    const npmPackage: NPMPackage = await got(
      `https://registry.npmjs.org/${name}`,
    ).json();

    const dependencies: Record<string, string> = {};
    for (const [ name, range ] of Object.entries(
      npmPackage.versions[version].dependencies ?? {},
    )) {
      const subPackage: NPMPackage = await got(
        `https://registry.npmjs.org/${name}`,
      ).json();

      dependencies[name] =
        maxSatisfying(Object.keys(subPackage.versions), range) ?? range;
    }

    return res.status(200).json({ name, version, dependencies });
  } catch (error) {
    return next(error);
  }
};
