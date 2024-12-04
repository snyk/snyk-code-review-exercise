#include <gtest/gtest.h>
#include <nlohmann/json.hpp>
#include "model.h"
#include "npm.h"

using nlohmann::json;
using model::VersionedPackage;

TEST(VersionedPackageTest, TestGetVersionedPackage) {
    // Define an instance of VersionedPackage
    VersionedPackage package = npm::get_versioned_package("minimatch", "3.1.2");

    // Serialize the instance to JSON
    json generated_json;
    model::to_json(generated_json, package);

    std::string expected_json_str = R"({
        "dependencies": [
          {
            "dependencies": [
              {"dependencies": [], "name": "balanced-match", "version": "1.0.2"},
              {"dependencies": [], "name": "concat-map", "version": "0.0.1"}
            ],
            "name": "brace-expansion",
            "version": "1.1.11"
          }
        ],
        "name": "minimatch",
        "version": "3.1.2"
    })";
    json expected_json = json::parse(expected_json_str);

    ASSERT_EQ(generated_json, expected_json);
}