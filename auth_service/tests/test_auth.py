import pytest

import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from app import create_app
from models import db
@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True

    with app.test_client() as client:
        with app.app_context():
            db.create_all()
        yield client
        with app.app_context():
            db.drop_all()


# ── Test Register ─────────────────────────
def test_register(client):
    response = client.post("/auth/register", json={
        "name": "Test User",
        "email": "test@example.com",
        "password": "123456"
    })

    assert response.status_code == 201
    data = response.get_json()
    assert data["message"] == "User registered successfully"


# ── Test Duplicate Register ───────────────
def test_duplicate_register(client):
    client.post("/auth/register", json={
        "name": "Test User",
        "email": "test@example.com",
        "password": "123456"
    })

    response = client.post("/auth/register", json={
        "name": "Test User",
        "email": "test@example.com",
        "password": "123456"
    })

    assert response.status_code == 409


# ── Test Login ────────────────────────────
def test_login(client):
    client.post("/auth/register", json={
        "name": "Test User",
        "email": "test@example.com",
        "password": "123456"
    })

    response = client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "123456"
    })

    assert response.status_code == 200
    data = response.get_json()
    assert "access_token" in data


# ── Test Protected Route ──────────────────
def test_me(client):
    client.post("/auth/register", json={
        "name": "Test User",
        "email": "test@example.com",
        "password": "123456"
    })

    login = client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "123456"
    })

    token = login.get_json()["access_token"]

    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data["user"]["email"] == "test@example.com"