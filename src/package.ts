import { RequestHandler } from 'express';

/**
 * @TODO: Retrieve package data from the npm registry and return it
 */
export const getPackage: RequestHandler = async function (req, res, next) {
  const { name, version } = req.params;

  console.log(`${name}@${version} requested`);

  try {
    return res
      .status(200)
      .json({});
  } catch (error) {
    return next(error);
  }
};
