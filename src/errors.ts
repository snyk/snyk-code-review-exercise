export class VersionNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VersionNotFoundError';
  }
}

export class CircularDependencyError extends Error {
  constructor(packageName: string) {
    super(`Circular dependency detected for package: ${packageName}`);
    this.name = 'CircularDependencyError';
  }
}
