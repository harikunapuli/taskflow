from flask import Flask
from flask_jwt_extended import JWTManager
from config import Config
from models import db
from routes import task_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    JWTManager(app)

    app.register_blueprint(task_bp, url_prefix="/tasks")

    with app.app_context():
        db.create_all()
        print("✅ Task service tables created successfully")

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5002, debug=Config.DEBUG)