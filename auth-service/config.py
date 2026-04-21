import os
from dotenv import load_dotenv

# Load all variables from .env file
load_dotenv()

class Config:
    # ── MySQL ───────────────────────────────────────
    MYSQL_HOST     = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_PORT     = int(os.getenv("MYSQL_PORT", 3306))
    MYSQL_USER     = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")
    MYSQL_DB       = os.getenv("MYSQL_AUTH_DB", "auth_db")

    # ── SQLAlchemy ──────────────────────────────────
    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}"
        f"@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ── JWT ─────────────────────────────────────────
    JWT_SECRET_KEY         = os.getenv("JWT_SECRET_KEY")
    JWT_ACCESS_TOKEN_EXPIRES  = 3600   # 1 hour in seconds

    # ── Flask ───────────────────────────────────────
    DEBUG = os.getenv("FLASK_DEBUG", False)