from app.models.booking import Booking
from app.database import db

def check_room_conflict(room_id, start_time, end_time, exclude_booking_id=None):
    """
    Verifica se já existe alguma reserva para a mesma sala que se sobreponha
    ao intervalo solicitado (start_time até end_time).
    
    Regra de sobreposição de intervalos:
    Há conflito se: (reserva_existente.start_time < end_time) E (reserva_existente.end_time > start_time)
    """
    query = Booking.query.filter(
        Booking.room_id == room_id,
        Booking.start_time < end_time,
        Booking.end_time > start_time
    )

    # Caso no futuro você queira permitir edição de uma reserva existente
    if exclude_booking_id:
        query = query.filter(Booking.id != exclude_booking_id)

    conflicting_booking = query.first()
    return conflicting_booking