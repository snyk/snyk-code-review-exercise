from typing import Optional

from pydantic import BaseModel


class NPMPackageVersion(BaseModel):
    name: str
    version: str
    dependencies: Optional[dict[str, str]] = None


class NPMPackage(BaseModel):
    name: str
    description: str
    dist_tags: dict[str, str]
    versions: dict[str, NPMPackageVersion]
