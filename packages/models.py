class VersionedPackage:
    def __init__(
        self,
        name: str,
        version: str,
        description: str,
        dependencies: list["VersionedPackage"] | None = None
    ):
        self.name = name
        self.version = version
        self.description = description
        self.dependencies = dependencies or []
