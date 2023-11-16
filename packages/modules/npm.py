import requests

from packages.models import VersionedPackage

NPM_REGISTRY_URL = "https://registry.npmjs.org"


def get_versioned_package(name: str, version: str) -> VersionedPackage:
    url = f"{NPM_REGISTRY_URL}/{name}/{version}"

    response = requests.get(url)
    npm_package = response.json()

    package = VersionedPackage(
        name=npm_package["name"],
        description=npm_package["description"],
        version=npm_package["version"],
        dependencies=npm_package["dependencies"],
    )

    return package
