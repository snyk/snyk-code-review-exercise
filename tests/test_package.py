import json
from django.test import Client
import pytest

@pytest.mark.snapshot
def test_get_package(snapshot):
    client = Client()
    response = client.get("/package/minimatch/3.1.2")
    assert response.status_code == 200
    response_data = json.dumps(response.json(), sort_keys=True, indent=2)
    snapshot.assert_match(response_data, "get_package_response")
