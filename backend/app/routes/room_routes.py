from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt
from app.database import db
from app.models.room import Room

room_bp = Blueprint("rooms", __name__, url_prefix="/api/rooms")

@room_bp.route("", methods=["GET"])
def get_rooms():
    """Lista todas as salas cadastradas com seus detalhes técnicos."""
    rooms = Room.query.order_by(Room.name.asc()).all()
    return jsonify([room.to_dict() for room in rooms]), 200

@room_bp.route("/<int:room_id>", methods=["PUT"])
@jwt_required()
def update_room(room_id):
    """
    Permite à coordenação atualizar capacidade, equipamentos e status de funcionamento.
    Não altera ID nem apaga histórico de reservas.
    """
    claims = get_jwt()
    if claims.get("role") != "coordenacao":
        return jsonify({"error": "Acesso restrito: apenas a coordenação pode alterar dados da sala."}), 403

    room = Room.query.get(room_id)
    if not room:
        return jsonify({"error": "Sala não encontrada."}), 404

    data = request.get_json() or {}

    try:
        # Atualiza a capacidade se informada
        if "capacity" in data:
            room.capacity = int(data["capacity"])

        # Atualiza os equipamentos / recursos
        if "resources" in data:
            room.resources = str(data["resources"]).strip()

        # Atualiza o status operacional da sala
        if "status" in data:
            room.status = str(data["status"]).strip()

        db.session.commit()
        return jsonify({
            "message": "Dados da sala atualizados com sucesso.",
            "room": room.to_dict()
        }), 200

    except ValueError:
        return jsonify({"error": "A capacidade informada deve ser um número inteiro válido."}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erro interno ao atualizar a sala: {str(e)}"}), 500