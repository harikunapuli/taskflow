import pytest
from app import create_app
from models import db, Project, Task, Comment


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
    """Get JWT token for protected routes"""
    from flask_jwt_extended import create_access_token
    with client.application.app_context():
        token = create_access_token(identity="1")
    return {"Authorization": f"Bearer {token}"}


# ════════════════════════════════════════════════════
# PROJECT TESTS
# ════════════════════════════════════════════════════

def test_create_project(client, auth_headers):
    response = client.post("/tasks/projects",
        json={"title": "Test Project", "description": "My project"},
        headers=auth_headers
    )
    data = response.get_json()
    assert response.status_code == 201
    assert data["project"]["title"] == "Test Project"


def test_get_projects(client, auth_headers):
    # Create a project first
    client.post("/tasks/projects",
        json={"title": "Test Project"},
        headers=auth_headers
    )
    response = client.get("/tasks/projects", headers=auth_headers)
    data     = response.get_json()
    assert response.status_code == 200
    assert len(data["projects"]) == 1


def test_create_project_no_title(client, auth_headers):
    response = client.post("/tasks/projects",
        json={"description": "No title here"},
        headers=auth_headers
    )
    assert response.status_code == 400


def test_update_project(client, auth_headers):
    # Create project
    res = client.post("/tasks/projects",
        json={"title": "Old Title"},
        headers=auth_headers
    )
    project_id = res.get_json()["project"]["id"]

    # Update it
    response = client.put(f"/tasks/projects/{project_id}",
        json={"title": "New Title"},
        headers=auth_headers
    )
    data = response.get_json()
    assert response.status_code == 200
    assert data["project"]["title"] == "New Title"


def test_delete_project(client, auth_headers):
    # Create project
    res = client.post("/tasks/projects",
        json={"title": "To Delete"},
        headers=auth_headers
    )
    project_id = res.get_json()["project"]["id"]

    # Delete it
    response = client.delete(f"/tasks/projects/{project_id}",
        headers=auth_headers
    )
    assert response.status_code == 200


# ════════════════════════════════════════════════════
# TASK TESTS
# ════════════════════════════════════════════════════

def test_create_task(client, auth_headers):
    # Create project first
    res = client.post("/tasks/projects",
        json={"title": "Test Project"},
        headers=auth_headers
    )
    project_id = res.get_json()["project"]["id"]

    # Create task
    response = client.post("/tasks/tasks",
        json={
            "title":      "Test Task",
            "project_id": project_id,
            "priority":   "high",
            "status":     "todo"
        },
        headers=auth_headers
    )
    data = response.get_json()
    assert response.status_code == 201
    assert data["task"]["title"] == "Test Task"
    assert data["task"]["priority"] == "high"


def test_get_tasks(client, auth_headers):
    # Create project and task
    res        = client.post("/tasks/projects",
        json={"title": "Project"},
        headers=auth_headers
    )
    project_id = res.get_json()["project"]["id"]
    client.post("/tasks/tasks",
        json={"title": "Task 1", "project_id": project_id},
        headers=auth_headers
    )

    response = client.get("/tasks/tasks", headers=auth_headers)
    data     = response.get_json()
    assert response.status_code == 200
    assert len(data["tasks"]) == 1


def test_update_task_status(client, auth_headers):
    # Create project and task
    res        = client.post("/tasks/projects",
        json={"title": "Project"},
        headers=auth_headers
    )
    project_id = res.get_json()["project"]["id"]
    res        = client.post("/tasks/tasks",
        json={"title": "Task", "project_id": project_id},
        headers=auth_headers
    )
    task_id = res.get_json()["task"]["id"]

    # Update status — simulates Kanban drag and drop
    response = client.patch(f"/tasks/tasks/{task_id}",
        json={"status": "in_progress"},
        headers=auth_headers
    )
    data = response.get_json()
    assert response.status_code == 200
    assert data["task"]["status"] == "in_progress"


def test_delete_task(client, auth_headers):
    res        = client.post("/tasks/projects",
        json={"title": "Project"},
        headers=auth_headers
    )
    project_id = res.get_json()["project"]["id"]
    res        = client.post("/tasks/tasks",
        json={"title": "Task", "project_id": project_id},
        headers=auth_headers
    )
    task_id = res.get_json()["task"]["id"]

    response = client.delete(f"/tasks/tasks/{task_id}",
        headers=auth_headers
    )
    assert response.status_code == 200


def test_filter_tasks_by_status(client, auth_headers):
    res        = client.post("/tasks/projects",
        json={"title": "Project"},
        headers=auth_headers
    )
    project_id = res.get_json()["project"]["id"]

    # Create 2 tasks with different statuses
    client.post("/tasks/tasks",
        json={"title": "Todo Task", "project_id": project_id, "status": "todo"},
        headers=auth_headers
    )
    client.post("/tasks/tasks",
        json={"title": "Done Task", "project_id": project_id, "status": "done"},
        headers=auth_headers
    )

    # Filter by status
    response = client.get("/tasks/tasks?status=todo", headers=auth_headers)
    data     = response.get_json()
    assert response.status_code == 200
    assert len(data["tasks"]) == 1
    assert data["tasks"][0]["status"] == "todo"


# ════════════════════════════════════════════════════
# COMMENT TESTS
# ════════════════════════════════════════════════════

def test_add_comment(client, auth_headers):
    res        = client.post("/tasks/projects",
        json={"title": "Project"},
        headers=auth_headers
    )
    project_id = res.get_json()["project"]["id"]
    res        = client.post("/tasks/tasks",
        json={"title": "Task", "project_id": project_id},
        headers=auth_headers
    )
    task_id = res.get_json()["task"]["id"]

    response = client.post(f"/tasks/tasks/{task_id}/comments",
        json={"body": "This is a comment"},
        headers=auth_headers
    )
    data = response.get_json()
    assert response.status_code == 201
    assert data["comment"]["body"] == "This is a comment"


def test_get_comments(client, auth_headers):
    res        = client.post("/tasks/projects",
        json={"title": "Project"},
        headers=auth_headers
    )
    project_id = res.get_json()["project"]["id"]
    res        = client.post("/tasks/tasks",
        json={"title": "Task", "project_id": project_id},
        headers=auth_headers
    )
    task_id = res.get_json()["task"]["id"]
    client.post(f"/tasks/tasks/{task_id}/comments",
        json={"body": "Comment 1"},
        headers=auth_headers
    )

    response = client.get(f"/tasks/tasks/{task_id}/comments",
        headers=auth_headers
    )
    data = response.get_json()
    assert response.status_code == 200
    assert len(data["comments"]) == 1


# ── Health check ──────────────────────────────────────
def test_health_check(client):
    response = client.get("/tasks/health")
    assert resp