from datetime import datetime
from app.database import db
from app.models.booking import Booking
from app.models.room import Room

class BookingService:
    @staticmethod
    def get_all_bookings():
        return Booking.query.order_by(Booking.start_time.asc()).all()

    @staticmethod
    def create_booking(data):
        room_id = data.get("room_id")
        course = data.get("course")
        start_time_str = data.get("start_time")
        end_time_str = data.get("end_time")

        if not all([room_id, course, start_time_str, end_time_str, data.get("professor_name"), data.get("subject"), data.get("turn")]):
            raise ValueError("Todos os campos obrigatórios devem ser preenchidos.")

        try:
            start_time = datetime.fromisoformat(start_time_str)
            end_time = datetime.fromisoformat(end_time_str)
        except ValueError:
            raise ValueError("Formato de data e hora inválido. Utilize o padrão ISO.")

        if start_time >= end_time:
            raise ValueError("O horário de início deve ser anterior ao horário de término.")

        room = Room.query.get(room_id)
        if not room:
            raise ValueError("Sala não encontrada.")

        if room.restricted_course and room.restricted_course.strip().lower() != course.strip().lower():
            raise ValueError(f"Esta sala é exclusiva para o curso de {room.restricted_course}.")

        # Checa colisão com outras reservas
        conflict = Booking.query.filter(
            Booking.room_id == room_id,
            Booking.start_time < end_time,
            Booking.end_time > start_time
        ).first()

        if conflict:
            raise ValueError(f"Conflito: a sala já está reservada entre {conflict.start_time.strftime('%H:%M')} e {conflict.end_time.strftime('%H:%M')}.")

        new_booking = Booking(
            room_id=room_id,
            professor_name=data.get("professor_name"),
            subject=data.get("subject"),
            course=course,
            turn=data.get("turn"),
            start_time=start_time,
            end_time=end_time
        )
        db.session.add(new_booking)
        db.session.commit()
        return new_booking

    @staticmethod
    def update_booking(booking_id, data):
        booking = Booking.query.get(booking_id)
        if not booking:
            raise ValueError("Reserva não encontrada.")

        room_id = data.get("room_id", booking.room_id)
        course = data.get("course", booking.course)
        start_time = datetime.fromisoformat(data["start_time"]) if "start_time" in data else booking.start_time
        end_time = datetime.fromisoformat(data["end_time"]) if "end_time" in data else booking.end_time

        if start_time >= end_time:
            raise ValueError("O horário de início deve ser anterior ao horário de término.")

        room = Room.query.get(room_id)
        if not room:
            raise ValueError("Sala não encontrada.")

        if room.restricted_course and room.restricted_course.strip().lower() != course.strip().lower():
            raise ValueError(f"Esta sala é exclusiva para o curso de {room.restricted_course}.")

        # Checa colisão excluindo a própria reserva que está sendo editada
        conflict = Booking.query.filter(
            Booking.id != booking_id,
            Booking.room_id == room_id,
            Booking.start_time < end_time,
            Booking.end_time > start_time
        ).first()

        if conflict:
            raise ValueError(f"Conflito: a sala já está reservada entre {conflict.start_time.strftime('%H:%M')} e {conflict.end_time.strftime('%H:%M')}.")

        booking.room_id = room_id
        booking.course = course
        booking.professor_name = data.get("professor_name", booking.professor_name)
        booking.subject = data.get("subject", booking.subject)
        booking.turn = data.get("turn", booking.turn)
        booking.start_time = start_time
        booking.end_time = end_time

        db.session.commit()
        return booking

    @staticmethod
    def delete_booking(booking_id):
        booking = Booking.query.get(booking_id)
        if not booking:
            raise ValueError("Reserva não encontrada.")
        db.session.delete(booking)
        db.session.commit()
        return True