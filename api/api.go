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
	router.Handle("/package/{package}/{version}", http.HandlerFunc(packageHandler))
	return router
}

type npmPackageResponse struct {
	Versions map[string]npmPackageVersion `json:"versions"`
}

type npmPackageVersion struct {
	Name         string            `json:"name"`
	Version      string            `json:"version"`
	Dependencies map[string]string `json:"dependencies"`
}

type Package struct {
	Name        string              `json:"name"`
	Version     string              `json:"version"`
	Dependencies map[string]*Package `json:"dependecies"`
}

func packageHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	pkgName := vars["package"]
	pkgVersionConstraint := vars["version"]

	rootPkg, err := resolvePackage(pkgName, pkgVersionConstraint)
	if err != nil {
		w.WriteHeader(500)
		fmt.Fprintln(w, err)
		return
	}

	stringified, err := json.MarshalIndent(rootPkg, "", "  ")
	if err != nil {
		w.WriteHeader(500)
		fmt.Fprintln(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(200)
	w.Write(stringified)
}

func resolvePackage(name, versionConstraint string) (*Package, error) {
	pkg := &Package{Name: name, Dependencies: map[string]*Package{}}
	if err := resolveVersionAndFetchDependencies(pkg, versionConstraint); err != nil {
		return nil, err
	}
	return pkg, nil
}

func resolveVersionAndFetchDependencies(pkg *Package, versionConstraint string) error {
	pkgMeta, err := fetchPackageMeta(pkg.Name)
	if err != nil {
		return fmt.Errorf("error fetching versions for %s: %w", pkg.Name, err)
	}
	var versions []string
	for version := range pkgMeta.Versions {
		versions = append(versions, version)
	}

	highestCompatibleVersion, err := highestCompatibleVersion(versionConstraint, versions)
	if err != nil {
		return fmt.Errorf("error resolving highest compatible version for %s %s: %w", pkg.Name, versionConstraint, err)
	}
	pkg.Version = versionConstraint

	npmEntry, err := fetchPackage(pkg.Name, highestCompatibleVersion)
	if err != nil {
		return err
	}
	for dependencyName, dependencyVersionConstraint := range npmEntry.Dependencies {
		dependency := &Package{Name: dependencyName, Dependencies: map[string]*Package{}}
		pkg.Dependencies[dependencyName] = dependency
		if err := resolveVersionAndFetchDependencies(dependency, dependencyVersionConstraint); err != nil {
			return err
		}
	}
	return nil
}

func fetchPackage(packageName, version string) (*npmPackageVersion, error) {
	url := fmt.Sprintf("https://registry.npmjs.org/%s/%s", packageName, version)
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("expected status 200, got %d", resp.StatusCode)
	}
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	var pkg npmPackageVersion
	json.Unmarshal(bodyBytes, &pkg)
	return &pkg, nil
}

func fetchPackageMeta(p string) (*npmPackageResponse, error) {
	resp, err := http.Get(fmt.Sprintf("https://registry.npmjs.org/%s", p))
	if err != nil {
		return nil, err
	}

	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var parsed npmPackageResponse
	json.Unmarshal([]byte(body), &parsed)

	return &parsed, nil
}

// TODO handle constraintStr="latest"
func highestCompatibleVersion(constraintStr string, versions []string) (string, error) {
	constraint, err := semver.NewConstraint(constraintStr)
	if err != nil {
		return "", err
	}
	filtered := filterCompatibleVersions(constraint, versions)
	sort.Sort(filtered)
	if len(filtered) == 0 {
		return "", errors.New("no compatible versions found")
	}
	return filtered[0].String(), nil
}

func filterCompatibleVersions(constraint *semver.Constraints, versions []string) semver.Collection {
	var compatible semver.Collection
	for _, version := range versions {
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
