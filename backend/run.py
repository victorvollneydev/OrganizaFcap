from app import create_app
from app.database import db
from app.models import Room

app = create_app()

@app.cli.command("init-db")
def init_db():
    """Cria tabelas se não existirem e adiciona as salas apenas se estiver vazio."""
    # 1. Cria as tabelas apenas se ainda NÃO existirem (NÃO apaga nada)
    db.create_all()

    # 2. Só insere as salas se a tabela estiver zerada
    if Room.query.count() == 0:
        salas = [
            Room(name="Sala de Informática"),
            Room(name="Anfiteatro"),
            Room(name="Sala de Vídeo")
        ]
        db.session.bulk_save_objects(salas)
        db.session.commit()
        print("Tabelas verificadas e as 3 salas iniciais foram cadastradas!")
    else:
        print("As salas e reservas existentes foram mantidas intactas.")

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)