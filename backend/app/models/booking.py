from app.database import db
from datetime import datetime, timezone

class Booking(db.Model):
    __tablename__ = "bookings"

    id = db.Column(db.Integer, primary_key=True)
    room_id = db.Column(db.Integer, db.ForeignKey("rooms.id"), nullable=False)
    professor_name = db.Column(db.String(120), nullable=False)
    subject = db.Column(db.String(120), nullable=True) # Disciplina / Turma
    course = db.Column(db.String(120), nullable=False, default="Administração")  # Curso da disciplina
    reservation_type = db.Column(db.String(20), nullable=False, default="recorrente")  # 'recorrente' ou 'eventual'
    turn = db.Column(db.String(20), nullable=False)     # Manhã, Tarde ou Noite
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    

    def to_dict(self):
        return {
            "id": self.id,
            "room_id": self.room_id,
            "room_name": self.room.name if self.room else None,
            "building": self.room.building if self.room else None,
            "floor": self.room.floor if self.room else None,
            "professor_name": self.professor_name,
            "subject": self.subject,
            "course": self.course,
            "reservation_type": getattr(self, "reservation_type", "recorrente") or "recorrente",
            "turn": self.turn,
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat()
        }