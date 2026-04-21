from flask import Flask
from flask_jwt_extended import JWTManager
from config import Config
from models import db
from routes import auth_bp

def create_app():
    # ── Create Flask app ────────────────────────────
    app = Flask(__name__)

    # ── Load config from config.py ──────────────────
    app.config.from_object(Config)

    # ── Initialize extensions ───────────────────────
    db.init_app(app)       # bind SQLAlchemy to this app
    JWTManager(app)        # bind JWT manager to this app

    # ── Register blueprints ─────────────────────────
    app.register_blueprint(auth_bp, url_prefix="/auth")

    # ── Create tables if they don't exist ───────────
    with app.app_context():
        db.create_all()
        print("✅ Database tables created successfully")

    return app


# ── Run the app ─────────────────────────────────────
if __name__ == "__main__":
    app = create_app()
    app.run(
        host="0.0.0.0",   # accept connections from any IP (needed for Docker)
        port=5001,
        debug=Config.DEBUG
    )