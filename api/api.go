package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sort"
	"strings"

	"github.com/gorilla/mux"
	"golang.org/x/mod/semver"
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

type PackageHandlerResponse struct {
	Name         string            `json:"name"`
	Version      string            `json:"version"`
	Dependencies map[string]string `json:"dependencies"`
}

func packageHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	pkg, err := fetchPackageMeta(vars["package"])
	if err != nil {
		w.WriteHeader(500)
		return
	}

	var match *npmPackageVersion

	version := vars["version"]
	if version == "latest" {
		match = latestVersion(pkg.Versions)
	} else {
		match = matchingVersion(pkg.Versions, version)
	}

	if match == nil {
		w.WriteHeader(400)
		return
	}

	resp := PackageHandlerResponse{
		Name:         match.Name,
		Version:      match.Version,
		Dependencies: match.Dependencies,
	}

	stringified, err := json.MarshalIndent(resp, "", "  ")
	if err != nil {
		println(err.Error())
		w.WriteHeader(500)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(200)
	w.Write(stringified)
}

func latestVersion(m map[string]npmPackageVersion) *npmPackageVersion {
	var versions []string
	for key, _ := range m {
		if semver.Prerelease("v"+key) == "" {
			versions = append(versions, key)
		}
	}

	if len(versions) == 0 {
		return nil
	}

	sort.SliceStable(versions, func(i, j int) bool { return semver.Compare("v"+versions[i], "v"+versions[j]) > 0 })
	if match, ok := m[versions[0]]; ok {
		return &match
	}
	return nil
}

func matchingVersion(m map[string]npmPackageVersion, v string) *npmPackageVersion {
	if strings.HasPrefix(v, "v") == false {
		v = "v" + v
	}

	canonical := strings.TrimPrefix(semver.Canonical(v), "v")
	if canonical == "" {
		return nil
	}

	if match, ok := m[canonical]; ok {
		return &match
	}
	return nil
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
