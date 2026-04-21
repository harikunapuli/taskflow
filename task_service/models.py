from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Project(db.Model):
    __tablename__ = "projects"

    id          = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title       = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    owner_id    = db.Column(db.Integer, nullable=False)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship to tasks
    tasks = db.relationship("Task", backref="project", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id":          self.id,
            "title":       self.title,
            "description": self.description,
            "owner_id":    self.owner_id,
            "created_at":  self.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "task_count":  len(self.tasks)
        }


class Task(db.Model):
    __tablename__ = "tasks"

    id          = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title       = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status      = db.Column(db.Enum("todo", "in_progress", "done"), default="todo")
    priority    = db.Column(db.Enum("low", "medium", "high"), default="medium")
    project_id  = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=False)
    assigned_to = db.Column(db.Integer, nullable=True)
    due_date    = db.Column(db.Date, nullable=True)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship to comments
    comments = db.relationship("Comment", backref="task", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id":          self.id,
            "title":       self.title,
            "description": self.description,
            "status":      self.status,
            "priority":    self.priority,
            "project_id":  self.project_id,
            "assigned_to": self.assigned_to,
            "due_date":    str(self.due_date) if self.due_date else None,
            "created_at":  self.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        }


class Comment(db.Model):
    __tablename__ = "comments"

    id         = db.Column(db.Integer, primary_key=True, autoincrement=True)
    body       = db.Column(db.Text, nullable=False)
    task_id    = db.Column(db.Integer, db.ForeignKey("tasks.id"), nullable=False)
    user_id    = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":         self.id,
            "body":       self.body,
            "task_id":    self.task_id,
            "user_id":    self.user_id,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S")
        }