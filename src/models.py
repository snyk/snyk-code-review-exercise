from typing import TypedDict


class NPMPackageVersion(TypedDict):
    name: str
    version: str
    dependencies: dict[str, str]


class NPMPackage(TypedDict):
    name: str
    description: str
    dist_tags: dict[str, str]
    versions: dict[str, NPMPackageVersion]
