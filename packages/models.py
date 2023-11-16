class VersionedPackage:
    def __init__(self, name: str, version: str, description: str, dependencies: list[tuple]):
        self.name = name
        self.version = version
        self.description = description
        self.dependencies = dependencies
