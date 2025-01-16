package api

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"sort"

	"github.com/Masterminds/semver/v3"
	"github.com/gorilla/mux"
)

func New() http.Handler {
	router := mux.NewRouter()
	// review: can we edit the handler to allow for packages with names like 
	// `@snyk/snyk-docker-plugin`?
	router.Handle("/package/{package}/{version}", http.HandlerFunc(packageHandler))
	return router
}

type npmPackageMetaResponse struct {
	Versions map[string]npmPackageResponse `json:"versions"`
}

type npmPackageResponse struct {
	Name         string            `json:"name"`
	Version      string            `json:"version"`
	Dependencies map[string]string `json:"dependencies"`
}

// idea: the issue specified that the dependencies should be presented in a tree form.
// This makes sense, but seeing as the output of this is likely to be then used for 
// stage 3 - checking for vulnerable packages, it might make sense to also provide a 
// slice with the set, i.e. the unique packages, of dependencies. 
type NpmPackageVersion struct {
	Name         string                        `json:"name"`
	Version      string                        `json:"version"`
	Dependencies map[string]*NpmPackageVersion `json:"dependencies"`
}

func packageHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	pkgName := vars["package"]
	pkgVersion := vars["version"]

	rootPkg := &NpmPackageVersion{Name: pkgName, Dependencies: map[string]*NpmPackageVersion{}}

	// idea: use context.WithTimeout and make a channel for errors, run the func in a goroutine
	// then use a switch to listen to the timeout or the resulting error and return that. 
	// At the moment the package trucolor takes a very long time. 
	// Although maybe the concurrency makes the code too difficult for junior devs. 
	if err := resolveDependencies(rootPkg, pkgVersion); err != nil {
		// idea: improve logging of errors by providing some indication of the line
		// of code where the error took place.
		println(err.Error())
		// idea: could we improve the error handling here to indicate to the user
		// when the package or version is not found. Maybe we could return a 404 
		// status if the input package is not found.
		w.WriteHeader(500)
		return
	}

	stringified, err := json.MarshalIndent(rootPkg, "", "  ")
	if err != nil {
		// idea: improve logging of errors by providing some indication of the line
		// of code where the error took place.
		println(err.Error())
		w.WriteHeader(500)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(200)

	// Ignoring ResponseWriter errors
	// idea: start logging/keeping metrics of any ResponseWriter errors
	_, _ = w.Write(stringified)
}

func resolveDependencies(pkg *NpmPackageVersion, versionConstraint string) error {
	// review: add caching here. We will be calling `fetchPackageMeta` several times 
	// for the same package, most likely. 
	pkgMeta, err := fetchPackageMeta(pkg.Name)
	if err != nil {
		// review: wrap this error so we know it happened when fetching the pkg metadata.
		// We need to know if any dependencies have missing meta data that cause errors. 
		return err
	}
	// review: `semver.NewConstraint` can't handle constraints that come from exceptions. 
	// One exception is when running this for `npm` `v11.0.0` where one of the dependences 
	// has versionConstraint `strip-ansi@^6.0.1`. 
	// Implement a function to check if the constraint is in this form and split it by the `@`
	// before passing the the second part of the split as the versionConstraint.
	// N.B. We may also have to use the first part of the split as the package name. 
	concreteVersion, err := highestCompatibleVersion(versionConstraint, pkgMeta)
	// review: wrap this error so we know it happened when trying to find the highest compatible 
	// version. We need to know if there are errors processing the constraint string 
	// and for what package.
	if err != nil {
		return err
	}
	pkg.Version = concreteVersion

	npmPkg, err := fetchPackage(pkg.Name, pkg.Version)
	if err != nil {
		// review: add a log message here as we need to know if there are any errors
		// fetching packages.
		return err
	}
	for dependencyName, dependencyVersionConstraint := range npmPkg.Dependencies {
		// review: need to add caching here. 
		// The dependency tree for `express` contains  65 dependencies of the `es-errors` pkg
		// in its entire dependency graph. Each recrusive call to `resolveDependencies` for 
		// the `es-errors` pkg adds processing time. On my local machine I timed the API to take
		// 22 seconds for the entire dependency graph of `express`. 
		dep := &NpmPackageVersion{Name: dependencyName, Dependencies: map[string]*NpmPackageVersion{}}
		pkg.Dependencies[dependencyName] = dep
		// idea: we could maybe add some concurrency here so that we can use more than one
		// thread at a time to resolve the dependencies. 
		// Although maybe the concurrency makes the code too difficult for junior devs. 
		if err := resolveDependencies(dep, dependencyVersionConstraint); err != nil {
			return err
		}
	}
	return nil
}

func highestCompatibleVersion(constraintStr string, versions *npmPackageMetaResponse) (string, error) {
	constraint, err := semver.NewConstraint(constraintStr)
	if err != nil {
		return "", err
	}
	filtered := filterCompatibleVersions(constraint, versions)
	sort.Sort(filtered)
	if len(filtered) == 0 {
		return "", errors.New("no compatible versions found")
	}
	return filtered[len(filtered)-1].String(), nil
}

func filterCompatibleVersions(constraint *semver.Constraints, pkgMeta *npmPackageMetaResponse) semver.Collection {
	var compatible semver.Collection
	for version := range pkgMeta.Versions {
		semVer, err := semver.NewVersion(version)
		if err != nil {
			continue
		}
		if constraint.Check(semVer) {
			compatible = append(compatible, semVer)
		}
	}
	return compatible
}

func fetchPackage(name, version string) (*npmPackageResponse, error) {
	resp, err := http.Get(fmt.Sprintf("https://registry.npmjs.org/%s/%s", name, version))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var parsed npmPackageResponse
	_ = json.Unmarshal(body, &parsed)
	return &parsed, nil
}

func fetchPackageMeta(p string) (*npmPackageMetaResponse, error) {
	resp, err := http.Get(fmt.Sprintf("https://registry.npmjs.org/%s", p))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var parsed npmPackageMetaResponse
	if err := json.Unmarshal([]byte(body), &parsed); err != nil {
		return nil, err
	}

	return &parsed, nil
}
