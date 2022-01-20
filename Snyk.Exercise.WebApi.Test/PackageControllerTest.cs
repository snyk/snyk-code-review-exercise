using System.Collections.Generic;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Xunit;

namespace Snyk.Exercise.WebApi.Test
{
    public class PackageControllerTest
    {
        private readonly TestServer server;
        private readonly HttpClient client;

        public PackageControllerTest()
        {
            server = new TestServer(new WebHostBuilder().UseStartup<Startup>());
            client = server.CreateClient();
        }

        [Fact]
        public async Task GetPackageVersion_Success()
        {
            var packageName = "react";
            var packageVersion = "16.13.0";

            var response = await client.GetAsync($"/package/{packageName}/{packageVersion}");
            response.EnsureSuccessStatusCode();
            var responseString = await response.Content.ReadAsStringAsync();

            var result = JsonSerializer.Deserialize<PackageDependencies>(responseString, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            });

            Assert.Equal(packageName, result.Name);
            Assert.Equal(packageVersion, result.Version);

            var expectedDependencies = new Dictionary<string, string>()
            {
                { "loose-envify", "^1.1.0" },
                { "object-assign", "^4.1.1" },
                { "prop-types", "^15.6.2" },
            };

            Assert.Equal(expectedDependencies, result.Dependencies);
        }
    }
}
