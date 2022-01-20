using System.Collections.Generic;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using SemanticVersioning;

namespace Snyk.Exercise.WebApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class PackageController : ControllerBase
    {
        public PackageController()
        {
        }

        [HttpGet]
        [Route("{name}/{version}")]
        public async Task<PackageDependencies> Get(string name, string version)
        {
            var dependencyTree = new Dictionary<string, dynamic>();

            using var httpClient = new HttpClient();
            var response = await httpClient.GetAsync($"https://registry.npmjs.org/{name}");
            response.EnsureSuccessStatusCode();

            var jsonString = await response.Content.ReadAsStringAsync();
            var npmPackage = JsonSerializer.Deserialize<NpmPackage>(jsonString, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            });

            var dependencies = npmPackage.Versions[version].Dependencies;

            foreach (var dep in dependencies) {
                var subDep = GetDependencies(dep.Key, dep.Value).Result;
                dependencyTree.Add(dep.Key, new
                {
                    Version = dep.Value,
                    Dependecies = subDep
                });
            }

            return new PackageDependencies
            {
                Name = name,
                Version = version,
                Dependencies = dependencyTree,
            };
        }

        public async Task<Dictionary<string, dynamic>> GetDependencies(string name, string version)
        {
            using var httpClient = new HttpClient();
            var response = await httpClient.GetAsync($"https://registry.npmjs.org/{name}");
            response.EnsureSuccessStatusCode();
            var jsonString = await response.Content.ReadAsStringAsync();
            var npmPackage = JsonSerializer.Deserialize<NpmPackage>(jsonString, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            });

            var range = new Range(version);
            var v = range.MaxSatisfying(npmPackage.Versions.Keys);

            if (!string.IsNullOrEmpty(v))
            {
                var dependencyTree = new Dictionary<string, dynamic>();
                var newDeps = npmPackage.Versions[v].Dependencies;
                if (newDeps != null) {
                    foreach (var dep in newDeps)
                    {
                        var subDep = GetDependencies(dep.Key, dep.Value).Result;
                        dependencyTree.Add(dep.Key, new
                        {
                            Version = dep.Value,
                            Dependecies = subDep
                        });
                    }
                }

                return dependencyTree;
            }
            else
            {
                return null;
            }
        }
    }
}
