from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity
)
from models import db, User

# Create a Blueprint for auth routes
# Blueprint = a group of related routes
auth_bp = Blueprint("auth", __name__)


# ── Register ─────────────────────────────────────────
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    # Validate input
    if not data:
        return jsonify({"error": "No data provided"}), 400

    name     = data.get("name")
    email    = data.get("email")
    password = data.get("password")

    if not name or not email or not password:
        return jsonify({"error": "Name, email and password are required"}), 400

    # Check if email already exists
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"error": "Email already registered"}), 409

    # Create new user
    user = User(name=name, email=email)
    user.set_password(password)   # hashes the password

    db.session.add(user)
    db.session.commit()

    return jsonify({
        "message": "User registered successfully",
        "user":    user.to_dict()
    }), 201


# ── Login ─────────────────────────────────────────────
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data:
        return jsonify({"error": "No data provided"}), 400

    email    = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    # Find user by email
    user = User.query.filter_by(email=email).first()

    # Check password
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    # Generate JWT token
    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        "message":      "Login successful",
        "access_token": access_token,
        "user":         user.to_dict()
    }), 200


# ── Get current user (protected route) ───────────────
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    user    = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"user": user.to_dict()}), 200


# ── Verify token (called by Gateway) ─────────────────
@auth_bp.route("/verify", methods=["GET"])
@jwt_required()
def verify_token():
    user_id = get_jwt_identity()
    return jsonify({
        "valid":   True,
        "user_id": user_id
    }), 200


# ── Health check ──────────────────────────────────────
@auth_bp.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "auth service is running"}), 200