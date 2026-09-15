import os
from dotenv import load_dotenv
from app import create_app, db
from app.models.booking import Booking
from app.models.room import Room
from app.models.user import User

load_dotenv()

app = create_app()


def run_seed():
  with app.app_context():
    print("Iniciando população do banco de dados no Neon...")

    # 1. Recupera as senhas das variáveis de ambiente com validação
    coord_password = os.getenv("DEFAULT_COORD_PASSWORD")
    prof_password = os.getenv("DEFAULT_PROF_PASSWORD")

    if not coord_password or not prof_password:
      raise ValueError(
          "ERRO: As variáveis DEFAULT_COORD_PASSWORD e DEFAULT_PROF_PASSWORD "
          "precisam estar definidas no arquivo .env!"
      )

    # 2. Limpeza segura das tabelas e reset dos IDs para 1
    db.session.execute(
        db.text(
            "TRUNCATE TABLE bookings, rooms, users RESTART IDENTITY CASCADE;"
        )
    )
    db.session.commit()
    print("Tabelas limpas e IDs reiniciados.")

    # 3. Cadastro dos Usuários do Sistema
    coord = User(
        name="Coordenação Setorial FCAP",
        email="coordenacao@fcap.br",
        role="coordenacao",
    )
    coord.set_password(coord_password)

    prof = User(
        name="Corpo Docente FCAP",
        email="professor@fcap.br",
        role="professor",
    )
    prof.set_password(prof_password)

    db.session.add_all([coord, prof])
    db.session.commit()
    print("Usuários cadastrados com senhas seguras.")

    # 4. Cadastro das Salas
    rooms_data = [
        # Bloco A
        {"name": "Sala 9º Período", "building": "Bloco A", "floor": "2º Andar"},
        # Bloco B - Térreo
        {
            "name": "Sala de Informática",
            "building": "Bloco B",
            "floor": "Térreo",
        },
        {"name": "Sala de Vídeo", "building": "Bloco B", "floor": "Térreo"},
        {"name": "Anfiteatro", "building": "Bloco B", "floor": "Térreo"},
        # Bloco B - 1º Andar
        {
            "name": "Sala 1º Período",
            "building": "Bloco B",
            "floor": "1º Andar",
        },
        {
            "name": "Sala 2º Período",
            "building": "Bloco B",
            "floor": "1º Andar",
        },
        {
            "name": "Sala 3º Período",
            "building": "Bloco B",
            "floor": "1º Andar",
        },
        {
            "name": "Sala 4º Período",
            "building": "Bloco B",
            "floor": "1º Andar",
        },
        # Bloco B - 2º Andar
        {
            "name": "Sala 5º Período",
            "building": "Bloco B",
            "floor": "2º Andar",
        },
        {
            "name": "Sala 6º Período",
            "building": "Bloco B",
            "floor": "2º Andar",
        },
        {
            "name": "Sala 7º Período",
            "building": "Bloco B",
            "floor": "2º Andar",
        },
        {
            "name": "Sala 8º Período",
            "building": "Bloco B",
            "floor": "2º Andar",
        },
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

    print(
        f"Sucesso! Total de {len(rooms)} salas cadastradas e banco pronto para"
        " produção."
    )


if __name__ == "__main__":
  run_seed()