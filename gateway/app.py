import requests
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from flask_cors import CORS
import os

load_dotenv()

app = Flask(__name__)
CORS(app)

AUTH_SERVICE_URL  = os.getenv("AUTH_SERVICE_URL", "http://localhost:5001")
TASK_SERVICE_URL  = os.getenv("TASK_SERVICE_URL", "http://localhost:5002")
NOTIF_SERVICE_URL = os.getenv("NOTIF_SERVICE_URL", "http://localhost:5003")


def get_token():
    """Extract token from request header"""
    auth_header = request.headers.get("Authorization", "")
    return auth_header


def verify_token():
    """Call auth service to verify JWT token"""
    token = get_token()
    if not token:
        return None

    try:
        response = requests.get(
            f"{AUTH_SERVICE_URL}/auth/verify",
            headers={"Authorization": token},
            timeout=5
        )
        if response.status_code == 200:
            return response.json().get("user_id")
        return None
    except requests.exceptions.RequestException:
        return None


def forward_request(service_url, path):
    """Forward request to microservice"""
    url     = f"{service_url}{path}"
    token   = get_token()
    headers = {
        "Authorization":  token,
        "Content-Type":   "application/json"
    }

    try:
        if request.method == "GET":
            resp = requests.get(url, headers=headers,
                                params=request.args, timeout=10)
        elif request.method == "POST":
            resp = requests.post(url, headers=headers,
                                 json=request.get_json(), timeout=10)
        elif request.method == "PUT":
            resp = requests.put(url, headers=headers,
                                json=request.get_json(), timeout=10)
        elif request.method == "PATCH":
            resp = requests.patch(url, headers=headers,
                                  json=request.get_json(), timeout=10)
        elif request.method == "DELETE":
            resp = requests.delete(url, headers=headers, timeout=10)

        return jsonify(resp.json()), resp.status_code

    except requests.exceptions.ConnectionError:
        return jsonify({"error": "Service unavailable"}), 503
    except requests.exceptions.Timeout:
        return jsonify({"error": "Service timed out"}), 504


# ── Auth routes (no token needed) ────────────────────
@app.route("/auth/<path:path>", methods=["GET", "POST"])
def auth_gateway(path):
    return forward_request(AUTH_SERVICE_URL, f"/auth/{path}")


# ── Task routes (token required) ─────────────────────
@app.route("/tasks/<path:path>", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
@app.route("/tasks", methods=["GET", "POST"])
def task_gateway(path=""):
    user_id = verify_token()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    endpoint = f"/tasks/{path}" if path else "/tasks"
    return forward_request(TASK_SERVICE_URL, endpoint)


# ── Notification routes (token required) ─────────────
@app.route("/notif/<path:path>", methods=["GET", "POST", "PATCH"])
@app.route("/notif", methods=["GET", "POST"])
def notif_gateway(path=""):
    user_id = verify_token()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    endpoint = f"/notif/{path}" if path else "/notif"
    return forward_request(NOTIF_SERVICE_URL, endpoint)


# ── Health check ──────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "gateway is running"}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)