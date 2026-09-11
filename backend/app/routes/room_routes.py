from flask import Blueprint, jsonify
from app.models.room import Room

room_bp = Blueprint("rooms", __name__, url_prefix="/api/rooms")

@room_bp.route("", methods=["GET"])
def get_rooms():
    """Lista todas as 3 salas cadastradas."""
    rooms = Room.query.all()
    return jsonify([room.to_dict() for room in rooms]), 200