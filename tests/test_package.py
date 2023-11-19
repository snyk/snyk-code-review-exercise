from django.test import Client


def test_get_package():
    client = Client()
    response = client.get("/package/express/2.0.0")
    assert response.status_code == 200
    assert response.json() == {
        "dependencies": {"connect": ">= 1.1.0 < 2.0.0", "mime": ">= 0.0.1", "qs": ">= 0.0.6"},
        "name": "express",
        "version": "2.0.0",
        'description': 'Sinatra inspired web development framework',
    }
