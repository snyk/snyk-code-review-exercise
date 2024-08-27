import logging
import requests
import semver
import aiohttp
from requests.models import Response

from packages.models import VersionedPackage

NPM_REGISTRY_URL = "https://registry.npmjs.org"


async def get_package(name: str, range: str) -> VersionedPackage:
    url = f"{NPM_REGISTRY_URL}/{name}"
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(url) as response:
                response.raise_for_status()
                npm_package = await response.json()
                versions = list(npm_package["versions"].keys())
                version = semver.min_satisfying(versions, range)
                if version not in npm_package["versions"]:
                    raise aiohttp.ClientResponseError(
                        status=404, 
                        message="Version not found", 
                        request_info=response.request_info,
                        history=response.history
                    )
                version_record = npm_package["versions"].get(version)
                package = VersionedPackage(
                    name=version_record["name"],
                    version=version_record["version"],
                    description=version_record["description"],
                )
                dependencies = version_record.get("dependencies", {})

                package.dependencies = [
                    await get_package(name=dep_name, range=dep_range)
                    for dep_name, dep_range in dependencies.items()
                ]
                
        except aiohttp.ClientResponseError as http_err:
            logging.error(f"HTTP error occurred: {http_err}")
            raise
        except Exception as err:
            logging.error(f"Other error occurred: {err}")
            raise

    return package


def request_package(name: str, range: str) -> tuple[VersionedPackage, dict]:
    url = f"{NPM_REGISTRY_URL}/{name}"

    npm_package = requests.get(url).json()

    versions = list(npm_package["versions"].keys())
    version = semver.min_satisfying(versions, range)
    version_record = npm_package["versions"][version]

    return VersionedPackage(
        name=version_record["name"],
        version=version_record["version"],
        description=version_record["description"],
    ), version_record.get("dependencies", {})
