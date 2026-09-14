from app.database import db

class Room(db.Model):
    __tablename__ = "rooms"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    building = db.Column(db.String(50), nullable=False, default="Bloco A")
    floor = db.Column(db.String(50), nullable=False, default="Térreo")
    restricted_course = db.Column(db.String(100), nullable=True)

    bookings = db.relationship("Booking", backref="room", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "building": self.building,
            "floor": self.floor,
            "restricted_course": self.restricted_course
        }