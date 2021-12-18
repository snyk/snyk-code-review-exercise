from typing import Optional

import requests
from semver import max_satisfying

from src.models import NPMPackage, NPMPackageVersion

NPM_REGISTRY_URL = "https://registry.npmjs.org"


async def get_package(name: str, version: Optional[str] = None) -> NPMPackageVersion:
    url = f"{NPM_REGISTRY_URL}/{name}"
    npm_package = requests.get(url).json()
    package = NPMPackage(
        name=npm_package["name"],
        description=npm_package["description"],
        dist_tags=npm_package["dist-tags"],
        versions=npm_package["versions"],
    )
    if not version:
        version = max_satisfying(package.versions.keys(), "*")

    dependencies = package.versions[version].dependencies
    return NPMPackageVersion(name=name, version=version, dependencies=dependencies)
