/**
 * The result of a package request against `https://registry.npmjs.org`. This is
 * a subset of the returned data, not a full representation, that contains
 * everything you will need to carry out the exercise.
 *
 * @example
 * {
 *   "name": "react",
 *   "description": "React is a JavaScript library for building user interfaces.",
 *   "dist-tags": {
 *     "latest": "16.13.0"
 *   },
 *   "versions": {
 *     "16.13.0": {
 *       "name": "react",
 *       "version": "16.13.0",
 *       "dependencies": {
 *         "loose-envify": "^1.1.0",
 *         "object-assign": "^4.1.1",
 *         "prop-types": "^15.6.2",
 *       }
 *     }
 *   }
 * }

*/

export type Package = {
  version: string;
  dependencies: Record<string, Package>;
};

export type GetPackageResult = {
  name: string;
  version: string;
  // eslint-disable-next-line @typescript-eslint/ban-types
  dependencies: Record<string, Package | {}>;
};
export interface NPMPackage {
  name: string;
  description: string;
  'dist-tags': {
    [tag: string]: string;
  };
  versions: {
    [version: string]: {
      name: string;
      version: string;
      dependencies?: {
        [packageName: string]: string;
      };
    };
  };
}
