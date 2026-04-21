from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Project, Task, Comment

task_bp = Blueprint("task", __name__)


# ════════════════════════════════════════════════════
# PROJECT ROUTES
# ════════════════════════════════════════════════════

@task_bp.route("/projects", methods=["GET"])
@jwt_required()
def get_projects():
    user_id  = get_jwt_identity()
    projects = Project.query.filter_by(owner_id=user_id).all()
    return jsonify({"projects": [p.to_dict() for p in projects]}), 200


@task_bp.route("/projects", methods=["POST"])
@jwt_required()
def create_project():
    user_id = get_jwt_identity()
    data    = request.get_json()

    if not data or not data.get("title"):
        return jsonify({"error": "Title is required"}), 400

    project = Project(
        title       = data["title"],
        description = data.get("description", ""),
        owner_id    = user_id
    )
    db.session.add(project)
    db.session.commit()
    return jsonify({"message": "Project created", "project": project.to_dict()}), 201


@task_bp.route("/projects/<int:project_id>", methods=["GET"])
@jwt_required()
def get_project(project_id):
    project = Project.query.get_or_404(project_id)
    return jsonify({"project": project.to_dict()}), 200


@task_bp.route("/projects/<int:project_id>", methods=["PUT"])
@jwt_required()
def update_project(project_id):
    project = Project.query.get_or_404(project_id)
    data    = request.get_json()

    project.title       = data.get("title", project.title)
    project.description = data.get("description", project.description)
    db.session.commit()
    return jsonify({"message": "Project updated", "project": project.to_dict()}), 200


@task_bp.route("/projects/<int:project_id>", methods=["DELETE"])
@jwt_required()
def delete_project(project_id):
    project = Project.query.get_or_404(project_id)
    db.session.delete(project)
    db.session.commit()
    return jsonify({"message": "Project deleted"}), 200


# ════════════════════════════════════════════════════
# TASK ROUTES
# ════════════════════════════════════════════════════

@task_bp.route("/tasks", methods=["GET"])
@jwt_required()
def get_tasks():
    project_id = request.args.get("project_id")
    status     = request.args.get("status")
    priority   = request.args.get("priority")

    query = Task.query
    if project_id:
        query = query.filter_by(project_id=project_id)
    if status:
        query = query.filter_by(status=status)
    if priority:
        query = query.filter_by(priority=priority)

    tasks = query.all()
    return jsonify({"tasks": [t.to_dict() for t in tasks]}), 200


@task_bp.route("/tasks", methods=["POST"])
@jwt_required()
def create_task():
    data = request.get_json()

    if not data or not data.get("title") or not data.get("project_id"):
        return jsonify({"error": "Title and project_id are required"}), 400

    task = Task(
        title       = data["title"],
        description = data.get("description", ""),
        status      = data.get("status", "todo"),
        priority    = data.get("priority", "medium"),
        project_id  = data["project_id"],
        assigned_to = data.get("assigned_to"),
        due_date    = data.get("due_date")
    )
    db.session.add(task)
    db.session.commit()
    return jsonify({"message": "Task created", "task": task.to_dict()}), 201


@task_bp.route("/tasks/<int:task_id>", methods=["GET"])
@jwt_required()
def get_task(task_id):
    task = Task.query.get_or_404(task_id)
    return jsonify({"task": task.to_dict()}), 200


@task_bp.route("/tasks/<int:task_id>", methods=["PATCH"])
@jwt_required()
def update_task(task_id):
    task = Task.query.get_or_404(task_id)
    data = request.get_json()

    task.title       = data.get("title", task.title)
    task.description = data.get("description", task.description)
    task.status      = data.get("status", task.status)
    task.priority    = data.get("priority", task.priority)
    task.assigned_to = data.get("assigned_to", task.assigned_to)
    task.due_date    = data.get("due_date", task.due_date)

    db.session.commit()
    return jsonify({"message": "Task updated", "task": task.to_dict()}), 200


@task_bp.route("/tasks/<int:task_id>", methods=["DELETE"])
@jwt_required()
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    return jsonify({"message": "Task deleted"}), 200


# ════════════════════════════════════════════════════
# COMMENT ROUTES
# ════════════════════════════════════════════════════

@task_bp.route("/tasks/<int:task_id>/comments", methods=["GET"])
@jwt_required()
def get_comments(task_id):
    comments = Comment.query.filter_by(task_id=task_id).all()
    return jsonify({"comments": [c.to_dict() for c in comments]}), 200


@task_bp.route("/tasks/<int:task_id>/comments", methods=["POST"])
@jwt_required()
def add_comment(task_id):
    user_id = get_jwt_identity()
    data    = request.get_json()

    if not data or not data.get("body"):
        return jsonify({"error": "Comment body is required"}), 400

    comment = Comment(
        body    = data["body"],
        task_id = task_id,
        user_id = user_id
    )
    db.session.add(comment)
    db.session.commit()
    return jsonify({"message": "Comment added", "comment": comment.to_dict()}), 201


# ── Health check ──────────────────────────────────────
@task_bp.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "task service is running"}), 200