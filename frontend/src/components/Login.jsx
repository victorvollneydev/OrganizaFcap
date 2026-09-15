import React, { useState } from 'react';
import api from '../services/api';
import logoIcon from '../assets/logo-icon.png';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email: email.trim(),
        password,
      });

      // Imprime a resposta real do backend para conferência
      console.log('Resposta completa do Login:', response.data);

      // Captura o token independente do nome da chave retornado pelo Flask
      const token =
        response.data.access_token ||
        response.data.token ||
        response.data.jwt ||
        response.data.accessToken;

      const user = response.data.user || { email: email.trim() };

      if (!token) {
        throw new Error('Chave de acesso não encontrada na resposta do servidor.');
      }

      // Salva o token real no localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      if (onLoginSuccess) {
        onLoginSuccess(user);
      }
    } catch (err) {
      console.error('Erro no login:', err);
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Falha no login. Verifique seu e-mail e senha institucional.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Identidade Visual OrganizaFCAP */}
        <div style={styles.brandBlock}>
          <img src={logoIcon} alt="Símbolo FCAP" style={styles.logo} />
          <h1 style={styles.title}>
            Organiza<span style={{ color: '#E02B37' }}>FCAP</span>
          </h1>
          <p style={styles.subtitle}>Gestão e Reserva de Salas Acadêmicas</p>
        </div>

        {error && <div style={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>E-mail Institucional</label>
            <input
              type="email"
              required
              placeholder="ex: coordenacao@fcap.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Senha de Acesso</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={loading ? { ...styles.button, opacity: 0.7 } : styles.button}
          >
            {loading ? 'Validando acesso...' : 'Entrar'}
          </button>
        </form>

        <footer style={styles.footer}>
          Faculdade de Ciências da Administração de Pernambuco
        </footer>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    padding: '16px',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
    padding: '36px 28px',
    boxSizing: 'border-box',
  },
  brandBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '28px',
  },
  logo: {
    width: '64px',
    height: 'auto',
    marginBottom: '12px',
    objectFit: 'contain',
  },
  title: {
    fontSize: '26px',
    fontWeight: '800',
    color: '#193C8A', // Azul FCAP
    margin: '0 0 6px 0',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '13px',
    color: '#6B7280',
    margin: 0,
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    padding: '11px 14px',
    borderRadius: '8px',
    border: '1px solid #D1D5DB',
    fontSize: '14px',
    outline: 'none',
  },
  button: {
    marginTop: '6px',
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#193C8A',
    color: '#FFFFFF',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  errorAlert: {
    padding: '10px 14px',
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '16px',
    border: '1px solid #FCA5A5',
    textAlign: 'center',
  },
  footer: {
    marginTop: '28px',
    fontSize: '11px',
    color: '#9CA3AF',
    textAlign: 'center',
  },
};