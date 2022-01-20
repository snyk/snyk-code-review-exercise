using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Snyk.Exercise.WebApi
{
    /**
        The result of a package request against `https://registry.npmjs.org`. This is
        a subset of the returned data, not a full representation, that contains
        everything you will need to carry out the exercise.
     
        @example
        {
          "name": "react",
          "description": "React is a JavaScript library for building user interfaces.",
          "dist-tags": {
            "latest": "16.13.0"
          },
          "versions": {
            "16.13.0": {
              "name": "react",
              "version": "16.13.0",
              "dependencies": {
                "loose-envify": "^1.1.0",
                "object-assign": "^4.1.1",
                "prop-types": "^15.6.2",
              }
            }
          }
        }
    */
    public class NpmPackage
    {
        public string Name { get; set; }

        public string Description { get; set; }

        [JsonPropertyName("dist-tags")]
        public Dictionary<string, string> DistTags { get; set; }

        public Dictionary<string, NpmVersion> Versions { get; set; }
    }

    public class NpmVersion
    {
        public string Name { get; set; }

        public string Version { get; set; }

        public Dictionary<string, string> Dependencies { get; set; }
    }
}
