from flask import Flask
from flask_cors import CORS
from app.config import Config
from app.database import db

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Inicializa banco e CORS
    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # REGISTRO DAS BLUEPRINTS:
    from app.routes.room_routes import room_bp
    from app.routes.booking_routes import booking_bp

    app.register_blueprint(room_bp)
    app.register_blueprint(booking_bp)

    # Rota básica de saúde da API
    @app.route("/api/health", methods=["GET"])
    def health_check():
        return {"status": "ok", "message": "API de Reservas FCAP operando!"}, 200

    return app