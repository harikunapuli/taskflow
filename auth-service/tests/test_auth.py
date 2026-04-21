import pytest
from app import create_app
from models import db, User


# ── App fixture ──────────────────────────────────────
@pytest.fixture
def app():
    """Create a fresh app instance for each test"""
    app = create_app()

    # Override config for testing
    app.config.update({
        "TESTING":    True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",  # in-memory DB for tests
        "JWT_SECRET_KEY": "test-secret-key",
    })

    # Create all tables in test DB
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()  # clean up after each test


# ── Client fixture ───────────────────────────────────
@pytest.fixture
def client(app):
    """Give each test a test HTTP client"""
    return app.test_client()


# ── Helper ───────────────────────────────────────────
def register_user(client, name="Hari", email="hari@gmail.com", password="123456"):
    """Helper to register a user — reused across tests"""
    return client.post("/auth/register", json={
        "name":     name,
        "email":    email,
        "password": password
    })


# ════════════════════════════════════════════════════
# Register tests
# ════════════════════════════════════════════════════

def test_register_success(client):
    """Register a new user successfully"""
    response = register_user(client)
    data     = response.get_json()

    assert response.status_code == 201
    assert data["message"] == "User registered successfully"
    assert data["user"]["email"] == "hari@gmail.com"
    assert "password" not in data["user"]  # password must never be returned


def test_register_duplicate_email(client):
    """Cannot register same email twice"""
    register_user(client)  # first registration
    response = register_user(client)  # duplicate
    data     = response.get_json()

    assert response.status_code == 409
    assert "already registered" in data["error"]


def test_register_missing_fields(client):
    """Registration fails if fields are missing"""
    response = client.post("/auth/register", json={
        "email": "hari@gmail.com"
        # missing name and password
    })
    data = response.get_json()

    assert response.status_code == 400
    assert "required" in data["error"]


def test_register_no_data(client):
    """Registration fails if no data sent"""
    response = client.post("/auth/register", json={})
    data     = response.get_json()

    assert response.status_code == 400


# ════════════════════════════════════════════════════
# Login tests
# ════════════════════════════════════════════════════

def test_login_success(client):
    """Login with correct credentials returns token"""
    register_user(client)

    response = client.post("/auth/login", json={
        "email":    "hari@gmail.com",
        "password": "123456"
    })
    data = response.get_json()

    assert response.status_code == 200
    assert "access_token" in data
    assert data["message"] == "Login successful"


def test_login_wrong_password(client):
    """Login fails with wrong password"""
    register_user(client)

    response = client.post("/auth/login", json={
        "email":    "hari@gmail.com",
        "password": "wrongpassword"
    })
    data = response.get_json()

    assert response.status_code == 401
    assert "Invalid" in data["error"]


def test_login_wrong_email(client):
    """Login fails with email that doesn't exist"""
    response = client.post("/auth/login", json={
        "email":    "nobody@gmail.com",
        "password": "123456"
    })
    data = response.get_json()

    assert response.status_code == 401
    assert "Invalid" in data["error"]


def test_login_missing_fields(client):
    """Login fails if fields are missing"""
    response = client.post("/auth/login", json={
        "email": "hari@gmail.com"
        # missing password
    })
    data = response.get_json()

    assert response.status_code == 400


# ════════════════════════════════════════════════════
# Protected route tests
# ════════════════════════════════════════════════════

def test_get_current_user(client):
    """Get current user with valid token"""
    register_user(client)

    # Login to get token
    login_response = client.post("/auth/login", json={
        "email":    "hari@gmail.com",
        "password": "123456"
    })
    token = login_response.get_json()["access_token"]

    # Use token to access protected route
    response = client.get("/auth/me", headers={
        "Authorization": f"Bearer {token}"
    })
    data = response.get_json()

    assert response.status_code == 200
    assert data["user"]["email"] == "hari@gmail.com"


def test_get_current_user_no_token(client):
    """Protected route fails without token"""
    response = client.get("/auth/me")

    assert response.status_code == 401


def test_get_current_user_invalid_token(client):
    """Protected route fails with fake token"""
    response = client.get("/auth/me", headers={
        "Authorization": "Bearer faketoken123"
    })

    assert response.status_code == 422


# ════════════════════════════════════════════════════
# Health check test
# ════════════════════════════════════════════════════

def test_health_check(client):
    """Health check returns 200"""
    response = client.get("/auth/health")
    data     = response.get_json()

    assert response.status_code == 200
    assert data["status"] == "auth service is running"