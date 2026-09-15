import sys
from app import create_app, db
from app.models.user import User

app = create_app()


def update_user_password(email, new_password):
  with app.app_context():
    user = User.query.filter_by(email=email).first()
    if not user:
      print(f"Usuário com e-mail {email} não encontrado.")
      return

    user.set_password(new_password)
    db.session.commit()
    print(f"Senha atualizada com sucesso para: {email}")


if __name__ == "__main__":
  if len(sys.argv) < 3:
    print("Uso: python reset_password.py <email> <nova_senha>")
  else:
    update_user_password(sys.argv[1], sys.argv[2])

# para rodar o script, usar o comando no terminal:
# python reset_password.py coordenacao@fcap.br NovaSenhaSegura123