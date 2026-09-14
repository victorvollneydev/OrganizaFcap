import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
from app.database import db
from datetime import timedelta

load_dotenv()

def create_app():
    app = Flask(__name__)

    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=8)  # Token válido por 8 horas

    CORS(app)
    db.init_app(app)
    JWTManager(app)

    from app.routes.room_routes import room_bp
    from app.routes.booking_routes import booking_bp
    from app.routes.auth_routes import auth_bp

    app.register_blueprint(room_bp, url_prefix="/api/rooms")
    app.register_blueprint(booking_bp, url_prefix="/api/bookings")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    return app