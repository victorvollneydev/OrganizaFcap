from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app.services.booking_service import BookingService

booking_bp = Blueprint("bookings", __name__)

def is_coordenacao():
    """Verifica se o usuário logado possui perfil de coordenação."""
    claims = get_jwt()
    return claims.get("role") == "coordenacao"

@booking_bp.route("", methods=["GET"])
@jwt_required()
def get_bookings():
    """Tanto professores quanto coordenação podem visualizar os agendamentos."""
    bookings = BookingService.get_all_bookings()
    return jsonify([b.to_dict() for b in bookings]), 200

@booking_bp.route("", methods=["POST"])
@jwt_required()
def create_booking():
    """Apenas coordenação pode criar reservas."""
    if not is_coordenacao():
        return jsonify({"error": "Acesso restrito: apenas a coordenação pode criar agendamentos."}), 403

    data = request.get_json() or {}
    try:
        booking = BookingService.create_booking(data)
        return jsonify({
            "message": "Reserva criada com sucesso.",
            "booking": booking.to_dict()
        }), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        import traceback
        traceback.print_exc()  # Imprime o erro exato no terminal
        return jsonify({"error": str(e)}), 500

@booking_bp.route("/<int:booking_id>", methods=["PUT"])
@jwt_required()
def edit_booking(booking_id):
    """Apenas coordenação pode editar reservas existentes."""
    if not is_coordenacao():
        return jsonify({"error": "Acesso restrito: apenas a coordenação pode editar agendamentos."}), 403

    data = request.get_json() or {}
    try:
        updated = BookingService.update_booking(booking_id, data)
        return jsonify({
            "message": "Reserva atualizada com sucesso.",
            "booking": updated.to_dict()
        }), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "Erro interno ao atualizar a reserva."}), 500

@booking_bp.route("/<int:booking_id>", methods=["DELETE"])
@jwt_required()
def delete_booking(booking_id):
    """Apenas coordenação pode excluir reservas."""
    if not is_coordenacao():
        return jsonify({"error": "Acesso restrito: apenas a coordenação pode cancelar agendamentos."}), 403

    try:
        BookingService.delete_booking(booking_id)
        return jsonify({"message": "Reserva cancelada com sucesso."}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": "Erro interno ao cancelar reserva."}), 500