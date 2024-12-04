#include "model.h"

namespace model {
  void to_json(nlohmann::json& j, const VersionedPackage& vp) {
    j = nlohmann::json{
      {"name", vp.name_},
      {"version", vp.version_},
      {"dependencies", vp.dependencies_}
    };
  }
}