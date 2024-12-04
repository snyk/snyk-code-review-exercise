#include "model.h"
#include "util.h"

#include <string>
#include <sstream>
#include <nlohmann/json.hpp>

namespace npm {
  namespace {
    using model::VersionedPackage;
    constexpr std::string_view NPM_REGISTRY_URL = "https://registry.npmjs.org";
  }

  VersionedPackage get_versioned_package(const std::string& name, const std::string& range) {
    std::string url = std::string(NPM_REGISTRY_URL) + "/" + name;

    std::ostringstream response_stream;
    nlohmann::json npm_package = nlohmann::json::parse(util::curl_request(url, &response_stream));
    response_stream.clear();

    std::vector<std::string> versions;
    for (auto it = npm_package["versions"].begin(); it != npm_package["versions"].end(); ++it) {
        versions.push_back(it.key());
    }
    std::string version = util::max_satisfying(versions, range);
    const nlohmann::json& version_record = npm_package["versions"][version];
    const nlohmann::json& dependencies = version_record.value("dependencies", nlohmann::json::object());

    VersionedPackage package{
        version_record["name"],
        version_record["version"],
        version_record["description"],
        {}
    };

    for (const auto& dep : dependencies.items()) {
        package.add_dependency(get_versioned_package(dep.key(), dep.value()));
    }

    return package;
  }
}