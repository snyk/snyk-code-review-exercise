from fastapi.testclient import TestClient

from src.app import app


def test_get_package():
    client = TestClient(app)

    response = client.get("/package/react/16.13.0")
    assert response.status_code == 200
    assert response.json() == {
        "dependencies": {
            "loose-envify": {
                "dependencies": {"js-tokens": {"dependencies": {}, "version": "4.0.0"}},
                "version": "1.4.0",
            },
            "object-assign": {"dependencies": {}, "version": "4.1.1"},
            "prop-types": {
                "dependencies": {
                    "loose-envify": {
                        "dependencies": {"js-tokens": {"dependencies": {}, "version": "4.0.0"}},
                        "version": "1.4.0",
                    },
                    "object-assign": {"dependencies": {}, "version": "4.1.1"},
                    "react-is": {"dependencies": {}, "version": "16.13.1"},
                },
                "version": "15.7.2",
            },
        },
        "name": "react",
        "version": "16.13.0",
    }
