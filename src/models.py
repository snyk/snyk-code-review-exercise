from typing import Optional

from pydantic import BaseModel


class Package(BaseModel):
    version: str
    dependencies: dict[str, dict]


class NPMPackageVersion(BaseModel):
    name: str
    version: str
    dependencies: Optional[dict[str, str]] = {}


class NPMPackage(BaseModel):
    name: str
    description: str
    dist_tags: dict[str, str]
    versions: dict[str, NPMPackageVersion]


Package.update_forward_refs()
