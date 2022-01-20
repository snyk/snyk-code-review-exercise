using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

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
            using var httpClient = new HttpClient();
            var response = await httpClient.GetAsync($"https://registry.npmjs.org/{name}");
            response.EnsureSuccessStatusCode();

            var jsonString = await response.Content.ReadAsStringAsync();
            var npmPackage = JsonSerializer.Deserialize<NpmPackage>(jsonString, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            });

            return new PackageDependencies
            {
                Name = name,
                Version = version,
                Dependencies = npmPackage.Versions[version].Dependencies,
            };
        }
    }
}
