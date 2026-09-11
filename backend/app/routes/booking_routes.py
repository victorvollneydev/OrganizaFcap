from flask import Blueprint, request, jsonify
from datetime import datetime
from app.database import db
from app.models.booking import Booking
from app.models.room import Room
from app.services.booking_service import check_room_conflict

booking_bp = Blueprint("bookings", __name__, url_prefix="/api/bookings")

@booking_bp.route("", methods=["GET"])
def get_bookings():
    """Lista todas as reservas cadastradas em ordem cronológica."""
    bookings = Booking.query.order_by(Booking.start_time.asc()).all()
    return jsonify([b.to_dict() for b in bookings]), 200

@booking_bp.route("", methods=["POST"])
def create_booking():
    """Cria uma nova reserva validando choques de horário."""
    data = request.get_json()

    # 1. Validação de campos obrigatórios
    required_fields = ["room_id", "professor_name", "subject", "turn", "start_time", "end_time"]
    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"O campo '{field}' é obrigatório."}), 400

    # 2. Verifica se a sala existe
    room = db.session.get(Room, data["room_id"])
    if not room:
        return jsonify({"error": "Sala informada não foi encontrada."}), 404

    # 3. Conversão de datas (formato ISO: YYYY-MM-DDTHH:MM:SS)
    try:
        start = datetime.fromisoformat(data["start_time"])
        end = datetime.fromisoformat(data["end_time"])
    except ValueError:
        return jsonify({"error": "Formato de data/hora inválido. Use o padrão ISO (ex: 2026-09-08T08:00:00)."}), 400

    if start >= end:
        return jsonify({"error": "O horário de início deve ser anterior ao horário de término."}), 400

    # 4. Checagem de choque de horários na mesma sala
    conflict = check_room_conflict(data["room_id"], start, end)
    if conflict:
        return jsonify({
            "error": "Choque de horários!",
            "message": f"A sala '{room.name}' já está ocupada por {conflict.professor_name} ({conflict.subject}) nesse horário."
        }), 409

    # 5. Salva a reserva no PostgreSQL
    new_booking = Booking(
        room_id=data["room_id"],
        professor_name=data["professor_name"],
        subject=data["subject"],
        turn=data["turn"],
        start_time=start,
        end_time=end
    )

    db.session.add(new_booking)
    db.session.commit()

    return jsonify(new_booking.to_dict()), 201

@booking_bp.route("/<int:booking_id>", methods=["DELETE"])
def delete_booking(booking_id):
    """Cancela/remove um agendamento."""
    booking = db.session.get(Booking, booking_id)
    if not booking:
        return jsonify({"error": "Reserva não encontrada."}), 404

    db.session.delete(booking)
    db.session.commit()
    return jsonify({"message": "Reserva cancelada com sucesso!"}), 200