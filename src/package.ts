import { RequestHandler } from 'express';
import { maxSatisfying } from 'semver';
import got from 'got';
import { NPMPackage, Package } from './types';
import { cache } from './cache';
import log from './logger';
import { config } from './config';
import { CircularDependencyError, VersionNotFoundError } from './errors';

/**
 * Fetches package metadata from the npm registry with retry logic and exponential backoff.
 * If the request fails, the function retries up to a specified number of times, with an increasing
 *  delay between attempts.
 *
 * @param name - The name of the npm package to fetch.
 * @param retries - Maximum number of retry attempts (default: 3).
 * @param delay - Initial delay in milliseconds between retries (default: 500ms).
 *
 * @returns {Promise<NPMPackage>} A promise that resolves to the package metadata object.
 *
 * @throws {Error} Throws an error if the maximum number of retries is reached without success.
 */
async function fetchPackageFromRegistry(name: string, retries = 3, delay = 500): Promise<NPMPackage> {
  const cacheKey = `npm-${name}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    return cachedData as NPMPackage;
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Attempt to fetch the package from the registry
      const { body: npmPackage } = await got<NPMPackage>(
        `https://registry.npmjs.org/${name}`, { responseType: 'json' });

      // Cache the result and return it
      cache.set(cacheKey, npmPackage);
      return npmPackage;

    } catch (error) {
      // If we've reached the max number of retries, throw the error
      if (attempt === retries) {
        log.error({ package: name, attempt }, `Failed after ${attempt + 1} attempts`);
        throw error;
      }

      // Log the error and retry after a delay
      log.warn({ package: name, attempt }, `Attempt ${attempt + 1} failed. Retrying in ${delay}ms...`);

      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;  // Increase the delay for the next attempt
    }
  }
  throw new Error(`Failed to fetch package metadata for ${name} after ${retries} retries`);
}


/**
 * Recursively resolves the full dependency tree for a given npm package and version range.
 * Detects and prevents circular dependencies by keeping track of the packages currently being resolved.
 *
 * @param name - The name of the npm package to fetch.
 * @param range - The version or version range to resolve for the package.
 * @param depth - The current recursion depth (default: 0).
 * @param currentPath - A Set to track the packages along the current recursion path.
 *
 * @returns {Promise<Package>} A promise that resolves to the complete (or partial) dependency tree for the package.
 *
 * @throws {VersionNotFoundError} - Throws this error if no version satisfying the specified range can be found.
 * @throws {CircularDependencyError} - Throws this error if a circular dependency is detected.
 */
export async function resolvePackageTree(
  name: string,
  range: string,
  depth = 0,
  currentPath: Set<string> = new Set()
): Promise<Package> {
  // Detect and prevent circular dependencies by tracking the current path
  if (currentPath.has(name)) {
    throw new CircularDependencyError(name);
  }

  // Mark the current package as being resolved
  currentPath.add(name);

  if (depth > config.maxDepth) {
    log.warn({ package: name, depth }, 'Maximum depth exceeded, returning partial result');
    return {
      version: 'unknown',
      dependencies: {},
      partial: true,
    };
  }

  const cacheKey = `${name}@${range}`;
  const cachedPackage = cache.get(cacheKey);
  if (cachedPackage) {
    return cachedPackage as Package;
  }

  const npmPackage = await fetchPackageFromRegistry(name);
  const version = maxSatisfying(Object.keys(npmPackage.versions), range);

  if (!version) {
    throw new VersionNotFoundError(`No version satisfying ${range} found for package ${name}`);
  }

  const versionData = npmPackage.versions[version];
  const dependencies: Record<string, Package> = {};

  // Resolve the dependencies of this version recursively
  if (versionData.dependencies) {
    for (const [depName, depRange] of Object.entries(versionData.dependencies)) {
      dependencies[depName] = await resolvePackageTree(depName, depRange, depth + 1, currentPath);
    }
  }

  const resolvedPackage: Package = { version, dependencies };
  cache.set(cacheKey, resolvedPackage);  // Cache the result for future requests

  // Unmark the current package after resolving it
  currentPath.delete(name);

  return resolvedPackage;
}


/**
 * Type guard function used to differentiate between generic errors and HTTP-specific errors that
 * contain a `response` object with an HTTP status code.
 *
 * @param error - The error object to be checked.
 * @returns {boolean} - `true` if error contains a `response` property with an HTTP status code; else, `false`.
 */
function isHttpError(error: unknown): error is { response: { statusCode: number } } {
  return typeof error === 'object' && error !== null && 'response' in error;
}

/**
 * Retrieves the package data from the npm registry, resolves its dependency tree
 * (recursively), and returns the result as a JSON response. The function uses in-memory caching
 * to prevent redundant API calls for the same package/version combination.
 *
 * - The function also handles various error scenarios:
 *   - Returns a 400 status if the specified version cannot be found (`VersionNotFoundError`).
 *   - Returns a 404 status if the package itself is not found (e.g., non-existent package).
 *   - For all other unexpected errors, it returns a 500 status indicating an internal server error.
 *
 * @param req - The Express request object, containing `name` and `version` in the URL parameters.
 * @param res - The Express response object, used to send the dependency tree or error messages
 * back to the client.
 * @param next - The Express `next` function, used to pass control to the next middleware in case of errors.
 *
 * @returns {void} Sends a JSON response containing the resolved dependency tree or an error message with
 *  the appropriate HTTP status code.
 */
export const getPackage: RequestHandler = async function (req, res, next) {
  const { name, version } = req.params;

  try {
    const dependencyTree = await resolvePackageTree(name, version);
    return res.status(200).json({ name, version, dependencies: dependencyTree.dependencies });
  } catch (error) {
    // Type assertion to tell TypeScript this is an Error object
    const err = error as Error;

    if (err.name === 'VersionNotFoundError') {
      log.error({ package: name, version }, `Version not found: ${err.message}`);
      return res.status(400).json({ error: err.message });
    } else if (err.name === 'CircularDependencyError') {
      log.error({ package: name }, `Circular dependency detected: ${err.message}`);
      return res.status(400).json({ error: err.message });
    } else if (isHttpError(err) && err.response?.statusCode === 404) {
      log.error({ package: name }, `Package ${name} not found`);
      return res.status(404).json({ error: `Package ${name} not found` });
    }
    log.error({ error: err }, 'Unexpected error occurred');
    return res.status(500).json({ error: 'Internal server error' });
  }
};


// Key Improvements:

// Separation of Concerns:
// Broken down the logic into smaller functions:
// resolvePackageTree handles recursive dependency resolution.
// fetchPackageFromRegistry handles the HTTP requests.
// The getPackage function only coordinates the request/response cycle.

// Caching:
// Added node-cache for caching both package metadata and resolved dependency trees.
// This prevents redundant API calls and improves performance.

// Error Handling:

// Introduced specific error handling for network issues, missing packages, and version resolution
// errors (using a custom VersionNotFoundError).
// Returns useful error messages to clients.
// Scalability: The MAX_DEPTH constant limits recursion depth to avoid extremely large
// or deeply nested dependency trees, which could impact performance or even crash the system.

// Handling Circular dependencies:
// package-a
//   └── package-b
//         └── package-a (circular dependency detected)
// Keep track of visited nodes (packages), and if a
// package appears twice during the resolution process, halt and return an error.

// Code Readability:
// Better comments explaining the key parts of the code.
// More modular functions that can be individually tested.


// Further Improvements:
// 1) Use input validation libraries like joi or express-validator to validate and sanitize the name and
// version parameters to ensure that only valid inputs are processed.

// 2)  Implement a more robust caching system, such as Redis, if the application needs to scale horizontally.
// Redis can provide distributed caching across multiple instances.

// 3) Implement a circuit breaker pattern to stop retrying after a number of failures in a given time window,
// and return a fallback response to the user. This prevents constant retries during prolonged outages.

// 5)  If the number of dependencies grows large, consider implementing pagination for the API response,
// especially if you expect large dependency trees.
