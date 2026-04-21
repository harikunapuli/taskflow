import pytest
from app import create_app
from models import db, Notification


@pytest.fixture
def app():
    app = create_app()
    app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "JWT_SECRET_KEY": "test-secret-key",
    })
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def auth_headers(client):
    from flask_jwt_extended import create_access_token
    with client.application.app_context():
        token = create_access_token(identity="1")
    return {"Authorization": f"Bearer {token}"}


# ════════════════════════════════════════════════════
# NOTIFICATION TESTS
# ════════════════════════════════════════════════════

def test_create_notification(client, auth_headers):
    response = client.post("/notif/notifications",
        json={"user_id": 1, "message": "Task is overdue!"},
        headers=auth_headers
    )
    data = response.get_json()
    assert response.status_code == 201
    assert data["notification"]["message"] == "Task is overdue!"
    assert data["notification"]["is_read"] == False


def test_get_notifications(client, auth_headers):
    # Create notification first
    client.post("/notif/notifications",
        json={"user_id": 1, "message": "Test notification"},
        headers=auth_headers
    )
    response = client.get("/notif/notifications", headers=auth_headers)
    data     = response.get_json()
    assert response.status_code == 200
    assert len(data["notifications"]) == 1


def test_mark_as_read(client, auth_headers):
    # Create notification
    res = client.post("/notif/notifications",
        json={"user_id": 1, "message": "Test"},
        headers=auth_headers
    )
    notif_id = res.get_json()["notification"]["id"]

    # Mark as read
    response = client.patch(f"/notif/notifications/{notif_id}/read",
        headers=auth_headers
    )
    data = response.get_json()
    assert response.status_code == 200
    assert data["notification"]["is_read"] == True


def test_unread_count(client, auth_headers):
    # Create 3 notifications
    for i in range(3):
        client.post("/notif/notifications",
            json={"user_id": 1, "message": f"Notification {i}"},
            headers=auth_headers
        )
    response = client.get("/notif/notifications/unread-count",
        headers=auth_headers
    )
    data = response.get_json()
    assert response.status_code == 200
    assert data["unread_count"] == 3


def test_create_notification_missing_fields(client, auth_headers):
    response = client.post("/notif/notifications",
        json={"message": "Missing user_id"},
        headers=auth_headers
    )
    assert response.status_code == 400


def test_health_check(client):
    response = client.get("/notif/health")
    assert response.status_code == 200