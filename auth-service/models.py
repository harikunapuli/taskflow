from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
import bcrypt

# Create SQLAlchemy instance
# This gets imported into app.py and bound to the Flask app
db = SQLAlchemy()

class User(db.Model):
    # ── Table name ──────────────────────────────────
    __tablename__ = "users"

    # ── Columns ─────────────────────────────────────
    id         = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name       = db.Column(db.String(100), nullable=False)
    email      = db.Column(db.String(150), unique=True, nullable=False)
    password   = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # ── Password methods ─────────────────────────────
    def set_password(self, plain_password):
        """Hash password before saving to DB"""
        hashed = bcrypt.hashpw(
            plain_password.encode("utf-8"),
            bcrypt.gensalt()
        )
        self.password = hashed.decode("utf-8")

    def check_password(self, plain_password):
        """Check if given password matches the stored hash"""
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            self.password.encode("utf-8")
        )

    def to_dict(self):
        """Convert user object to dictionary for JSON response"""
        return {
            "id":         self.id,
            "name":       self.name,
            "email":      self.email,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S")
        }

    def __repr__(self):
        return f"<User {self.email}>"