import os
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash
from app import create_app, db
from app.models.user import User
from app.models.room import Room
from app.models.booking import Booking

load_dotenv()

app = create_app()

def run_seed():
    with app.app_context():
        print("Iniciando população do banco de dados no Neon...")

        # 1. Limpeza segura das tabelas (ordem respeita chaves estrangeiras)
        Booking.query.delete()
        Room.query.delete()
        User.query.delete()
        db.session.commit()
        print("Tabelas limpas com sucesso.")

        # 2. Cadastro dos Usuários do Sistema
        users = [
            User(
                name="Coordenação Setorial FCAP",
                email="coordenacao@fcap.br",
                password_hash=generate_password_hash("FcapCoord2026@"),
                role="coordenacao"
            ),
            User(
                name="Corpo Docente FCAP",
                email="professor@fcap.br",
                password_hash=generate_password_hash("FcapProf2026@"),
                role="professor"
            )
        ]
        db.session.add_all(users)
        print("Usuários (Coordenação e Professor) inseridos.")

        rooms_data = [
            # Bloco A
            {"name": "Sala 9º Período", "building": "Bloco A", "floor": "2º Andar"},

            # Bloco B - Térreo
            {"name": "Sala de Informática", "building": "Bloco B", "floor": "Térreo"},
            {"name": "Sala de Vídeo", "building": "Bloco B", "floor": "Térreo"},
            {"name": "Anfiteatro", "building": "Bloco B", "floor": "Térreo"},

            # Bloco B - 1º Andar
            {"name": "Sala 1º Período", "building": "Bloco B", "floor": "1º Andar"},
            {"name": "Sala 2º Período", "building": "Bloco B", "floor": "1º Andar"},
            {"name": "Sala 3º Período", "building": "Bloco B", "floor": "1º Andar"},
            {"name": "Sala 4º Período", "building": "Bloco B", "floor": "1º Andar"},

            # Bloco B - 2º Andar
            {"name": "Sala 5º Período", "building": "Bloco B", "floor": "2º Andar"},
            {"name": "Sala 6º Período", "building": "Bloco B", "floor": "2º Andar"},
            {"name": "Sala 7º Período", "building": "Bloco B", "floor": "2º Andar"},
            {"name": "Sala 8º Período", "building": "Bloco B", "floor": "2º Andar"},

            # Bloco C - 1º Andar
            {"name": "Sala 1", "building": "Bloco C", "floor": "1º Andar"},
            {"name": "Sala 2", "building": "Bloco C", "floor": "1º Andar"},
            {"name": "Sala 3", "building": "Bloco C", "floor": "1º Andar"},
            {"name": "Sala 4", "building": "Bloco C", "floor": "1º Andar"},

            # Bloco C - 2º Andar
            {"name": "Sala 5", "building": "Bloco C", "floor": "2º Andar"},
            {"name": "Sala 6", "building": "Bloco C", "floor": "2º Andar"},
            {"name": "Sala 7", "building": "Bloco C", "floor": "2º Andar"},

            # Bloco C - 3º Andar
            {"name": "Sala 8", "building": "Bloco C", "floor": "3º Andar"},
            {"name": "Sala 9", "building": "Bloco C", "floor": "3º Andar"},

            # Bloco C - 4º Andar
            {"name": "Sala 10", "building": "Bloco C", "floor": "4º Andar"},
            {"name": "Sala 11", "building": "Bloco C", "floor": "4º Andar"},
        ]

        rooms = [Room(**r) for r in rooms_data]
        db.session.add_all(rooms)
        db.session.commit()

        print(f"Sucesso! Total de {len(rooms)} salas cadastradas e banco pronto para produção.")

if __name__ == "__main__":
    run_seed()