from typing import Optional

import requests
from semver import max_satisfying

from src.models import NPMPackage, Package

NPM_REGISTRY_URL = "https://registry.npmjs.org"


async def get_package(name: str, version: Optional[str] = None) -> dict:
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
    dependency_tree = {
        dependency_name: await get_dependencies(dependency_name, dependency_range)
        for dependency_name, dependency_range in dependencies.items()
    }
    return {"name": name, "version": version, "dependencies": dependency_tree}


async def get_dependencies(name: str, range: str) -> Package:
    url = f"{NPM_REGISTRY_URL}/{name}"
    npm_package = requests.get(url).json()
    package = NPMPackage(
        name=npm_package["name"],
        description=npm_package["description"],
        dist_tags=npm_package["dist-tags"],
        versions=npm_package["versions"],
    )

    dependencies = {}

    version = max_satisfying(package.versions.keys(), range)
    if version:
        new_dependencies = package.versions[version].dependencies
        dependencies = {
            dependency_name: await get_dependencies(dependency_name, dependency_range)
            for dependency_name, dependency_range in new_dependencies.items()
        }

    return Package(version=version or range, dependencies=dependencies)
