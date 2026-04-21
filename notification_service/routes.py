from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Notification

notif_bp = Blueprint("notif", __name__)


@notif_bp.route("/notifications", methods=["GET"])
@jwt_required()
def get_notifications():
    user_id       = get_jwt_identity()
    notifications = Notification.query.filter_by(user_id=user_id).order_by(
        Notification.created_at.desc()
    ).all()
    return jsonify({"notifications": [n.to_dict() for n in notifications]}), 200


@notif_bp.route("/notifications", methods=["POST"])
@jwt_required()
def create_notification():
    data = request.get_json()

    if not data or not data.get("message") or not data.get("user_id"):
        return jsonify({"error": "user_id and message are required"}), 400

    notif = Notification(
        user_id = data["user_id"],
        message = data["message"]
    )
    db.session.add(notif)
    db.session.commit()
    return jsonify({"message": "Notification created", "notification": notif.to_dict()}), 201


@notif_bp.route("/notifications/<int:notif_id>/read", methods=["PATCH"])
@jwt_required()
def mark_as_read(notif_id):
    notif         = Notification.query.get_or_404(notif_id)
    notif.is_read = True
    db.session.commit()
    return jsonify({"message": "Marked as read", "notification": notif.to_dict()}), 200


@notif_bp.route("/notifications/unread-count", methods=["GET"])
@jwt_required()
def unread_count():
    user_id = get_jwt_identity()
    count   = Notification.query.filter_by(user_id=user_id, is_read=False).count()
    return jsonify({"unread_count": count}), 200


@notif_bp.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "notification service is running"}), 200