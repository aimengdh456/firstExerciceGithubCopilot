import copy

import pytest
from fastapi.testclient import TestClient

from src.app import app, activities


@pytest.fixture(autouse=True)
def reset_activities():
    # backup the original activities and restore after each test
    orig = copy.deepcopy(activities)
    yield
    activities.clear()
    activities.update(orig)


@pytest.fixture()
def client():
    return TestClient(app)


def test_get_activities(client):
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_success(client):
    email = "testuser@example.com"
    resp = client.post(f"/activities/Chess%20Club/signup?email={email}")
    assert resp.status_code == 200
    assert email in activities["Chess Club"]["participants"]


def test_signup_duplicate(client):
    email = "duplicate@example.com"
    # first signup
    resp1 = client.post(f"/activities/Chess%20Club/signup?email={email}")
    assert resp1.status_code == 200
    # duplicate signup should fail
    resp2 = client.post(f"/activities/Chess%20Club/signup?email={email}")
    assert resp2.status_code == 400


def test_unregister_success(client):
    # ensure known participant exists
    email = "michael@mergington.edu"
    assert email in activities["Chess Club"]["participants"]
    resp = client.delete(f"/activities/Chess%20Club/unregister?email={email}")
    assert resp.status_code == 200
    assert email not in activities["Chess Club"]["participants"]


def test_unregister_not_registered(client):
    email = "notregistered@example.com"
    resp = client.delete(f"/activities/Chess%20Club/unregister?email={email}")
    assert resp.status_code == 400


def test_unregister_unknown_activity(client):
    email = "someone@example.com"
    resp = client.delete(f"/activities/Unknown%20Activity/unregister?email={email}")
    assert resp.status_code == 404
