from flask import Flask
from flask_jwt_extended import JWTManager
from config import Config
from models import db
from routes import notif_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    JWTManager(app)

    app.register_blueprint(notif_bp, url_prefix="/notif")

    with app.app_context():
        db.create_all()
        print("✅ Notification service tables created successfully")

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5003, debug=Config.DEBUG)