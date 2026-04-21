import pytest
from app import create_app
from models import db
from flask_jwt_extended import create_access_token


@pytest.fixture(scope="module")
def app():
    app = create_app()
    app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "JWT_SECRET_KEY": "test-secret-key",
        "JWT_ACCESS_TOKEN_EXPIRES": False
    })
    with app.app_context():
        db.create_all()
        yield app
        # removed db.drop_all() — SQLite in-memory auto destroys anyway

@pytest.fixture(scope="module")
def client(app):
    return app.test_client()


@pytest.fixture(scope="module")
def token(app):
    with app.app_context():
        return create_access_token(identity="1")


@pytest.fixture(scope="module")
def headers(token):
    return {"Authorization": f"Bearer {token}"}


# ════════════════════════════════════════════════════
# PROJECT TESTS
# ════════════════════════════════════════════════════

def test_health_check(client):
    res = client.get("/tasks/health")
    assert res.status_code == 200

def test_create_project(client, headers):
    res  = client.post("/tasks/projects",
        json={"title": "Test Project", "description": "My project"},
        headers=headers
    )
    data = res.get_json()
    assert res.status_code == 201
    assert data["project"]["title"] == "Test Project"


def test_get_projects(client, headers):
    res  = client.get("/tasks/projects", headers=headers)
    data = res.get_json()
    assert res.status_code == 200
    assert len(data["projects"]) >= 1


def test_create_project_no_title(client, headers):
    res = client.post("/tasks/projects",
        json={"description": "No title"},
        headers=headers
    )
    assert res.status_code == 400


def test_update_project(client, headers):
    # Create
    res        = client.post("/tasks/projects",
        json={"title": "Old Title"},
        headers=headers
    )
    project_id = res.get_json()["project"]["id"]

    # Update
    res  = client.put(f"/tasks/projects/{project_id}",
        json={"title": "New Title"},
        headers=headers
    )
    data = res.get_json()
    assert res.status_code == 200
    assert data["project"]["title"] == "New Title"


def test_delete_project(client, headers):
    res        = client.post("/tasks/projects",
        json={"title": "To Delete"},
        headers=headers
    )
    project_id = res.get_json()["project"]["id"]
    res        = client.delete(f"/tasks/projects/{project_id}",
        headers=headers
    )
    assert res.status_code == 200


# ════════════════════════════════════════════════════
# TASK TESTS
# ════════════════════════════════════════════════════

def test_create_task(client, headers):
    res        = client.post("/tasks/projects",
        json={"title": "Project For Tasks"},
        headers=headers
    )
    project_id = res.get_json()["project"]["id"]

    res  = client.post("/tasks/tasks",
        json={
            "title":      "Test Task",
            "project_id": project_id,
            "priority":   "high",
            "status":     "todo"
        },
        headers=headers
    )
    data = res.get_json()
    assert res.status_code == 201
    assert data["task"]["title"] == "Test Task"
    assert data["task"]["priority"] == "high"


def test_get_tasks(client, headers):
    res  = client.get("/tasks/tasks", headers=headers)
    data = res.get_json()
    assert res.status_code == 200
    assert len(data["tasks"]) >= 1


def test_update_task_status(client, headers):
    res        = client.post("/tasks/projects",
        json={"title": "Project"},
        headers=headers
    )
    project_id = res.get_json()["project"]["id"]
    res        = client.post("/tasks/tasks",
        json={"title": "Task", "project_id": project_id},
        headers=headers
    )
    task_id = res.get_json()["task"]["id"]

    res  = client.patch(f"/tasks/tasks/{task_id}",
        json={"status": "in_progress"},
        headers=headers
    )
    data = res.get_json()
    assert res.status_code == 200
    assert data["task"]["status"] == "in_progress"


def test_filter_tasks_by_status(client, headers):
    res        = client.post("/tasks/projects",
        json={"title": "Filter Project"},
        headers=headers
    )
    project_id = res.get_json()["project"]["id"]

    client.post("/tasks/tasks",
        json={"title": "Todo Task", "project_id": project_id, "status": "todo"},
        headers=headers
    )
    client.post("/tasks/tasks",
        json={"title": "Done Task", "project_id": project_id, "status": "done"},
        headers=headers
    )

    res  = client.get("/tasks/tasks?status=done", headers=headers)
    data = res.get_json()
    assert res.status_code == 200
    assert all(t["status"] == "done" for t in data["tasks"])


def test_delete_task(client, headers):
    res        = client.post("/tasks/projects",
        json={"title": "Project"},
        headers=headers
    )
    project_id = res.get_json()["project"]["id"]
    res        = client.post("/tasks/tasks",
        json={"title": "Task to delete", "project_id": project_id},
        headers=headers
    )
    task_id = res.get_json()["task"]["id"]
    res     = client.delete(f"/tasks/tasks/{task_id}", headers=headers)
    assert res.status_code == 200


# ════════════════════════════════════════════════════
# COMMENT TESTS
# ════════════════════════════════════════════════════

def test_add_comment(client, headers):
    res        = client.post("/tasks/projects",
        json={"title": "Comment Project"},
        headers=headers
    )
    project_id = res.get_json()["project"]["id"]
    res        = client.post("/tasks/tasks",
        json={"title": "Comment Task", "project_id": project_id},
        headers=headers
    )
    task_id = res.get_json()["task"]["id"]

    res  = client.post(f"/tasks/tasks/{task_id}/comments",
        json={"body": "This is a comment"},
        headers=headers
    )
    data = res.get_json()
    assert res.status_code == 201
    assert data["comment"]["body"] == "This is a comment"


def test_get_comments(client, headers):
    res        = client.post("/tasks/projects",
        json={"title": "Project"},
        headers=headers
    )
    project_id = res.get_json()["project"]["id"]
    res        = client.post("/tasks/tasks",
        json={"title": "Task", "project_id": project_id},
        headers=headers
    )
    task_id = res.get_json()["task"]["id"]
    client.post(f"/tasks/tasks/{task_id}/comments",
        json={"body": "Comment 1"},
        headers=headers
    )
    res  = client.get(f"/tasks/tasks/{task_id}/comments", headers=headers)
    data = res.get_json()
    assert res.status_code == 200
    assert len(data["comments"]) == 1