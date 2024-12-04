#pragma once
#include <string>
#include "model.h"

namespace npm {
  model::VersionedPackage get_versioned_package(const std::string& name, const std::string& range);
}
