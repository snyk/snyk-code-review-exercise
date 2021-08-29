import { RequestHandler } from 'express';
import got from 'got';
import { NPMDependencies, NPMPackage } from './types';

/**
 * Attempts to retrieve package data from the npm registry and return it
 */
export const getPackage: RequestHandler<{ name: string; version: string }> = async function (req, res, next) {
  const { name, version } = req.params;
  try {
    const dependencies = await getDependencies(name, version);
    if (dependencies) {
      return res.status(200).json({ name, version, dependencies });
    }
    return res.status(404).json({ message: `No information available for package ${name} with version ${version}` });
  } catch (error) {
    return next(error);
  }
};

export async function getNpmData(name: string): Promise<NPMPackage | null> {
  const request = got(`https://registry.npmjs.org/${name}`, { retry: 0, throwHttpErrors: false });
  // throws only if no server response
  const { statusCode, body } = await request;
  if (statusCode === 200) {
    return await request.json();
  } else if (statusCode === 404 && body === '{"error":"Not found"}') {
    return null;
  }
  // handle unexpected server response
  throw new Error(`Server rejected with status:${statusCode}\n${body}`);
}

export async function getDependencies(name: string, version: string): Promise<NPMDependencies | null> {
  const npmData = await getNpmData(name);
  if (npmData) {
    const npmVersionData = npmData?.versions?.[version];
    if (npmVersionData) {
      return npmVersionData.dependencies || {};
    }
  }
  return null;
}
