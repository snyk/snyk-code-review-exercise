using System.Collections.Generic;

public class PackageDependencies
{
    public string Name { get; set; }

    public string Version { get; set; }

    public Dictionary<string, string> Dependencies { get; set; }
}