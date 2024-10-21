package api_test

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/snyk/snyk-code-review-exercise/api"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestPackageHandler(t *testing.T) {
	handler := api.New()
	server := httptest.NewServer(handler)
	defer server.Close()

	testPackages := []struct {
		packageName    string
		version        string
		httpStatusCode int
	}{
		// can add more test cases here, just using the one from the interview
		{"trucolor", "4.0.4", http.StatusOK},                           // 200
		{"imaginary-package", "1.0.0", http.StatusInternalServerError}, // 500

	}

	for _, tp := range testPackages {
		t.Run(fmt.Sprintf("%s-%s", tp.packageName, tp.version), func(t *testing.T) {
			t.Logf("Starting test for package %s version %s", tp.packageName, tp.version)

			resp, err := server.Client().Get(server.URL + "/package/" + tp.packageName + "/" + tp.version)
			require.NoError(t, err)
			defer resp.Body.Close()

			t.Logf("Received response with status code %d", resp.StatusCode)
			assert.Equal(t, tp.httpStatusCode, resp.StatusCode)

			if resp.StatusCode == http.StatusOK {
				body, err := io.ReadAll(resp.Body)
				require.NoError(t, err)

				var data api.NpmPackageVersion
				err = json.Unmarshal(body, &data)
				require.NoError(t, err)

				t.Logf("Received package data for %s@%s", data.Name, data.Version)
				assert.Equal(t, tp.packageName, data.Name)
				assert.Equal(t, tp.version, data.Version)
			}
		})
	}
}
