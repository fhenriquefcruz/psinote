import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      toast.error('Erro ao fazer login: ' + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
      <input
        type="email"
        placeholder="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        style={{ padding: '0.6rem', border: '1px solid #ccc', borderRadius: '6px' }}
      />
      <input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        style={{ padding: '0.6rem', border: '1px solid #ccc', borderRadius: '6px' }}
      />
      <button
        type="submit"
        style={{ padding: '0.6rem', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
      >
        Entrar
      </button>
      <Link to="/register" style={{ textAlign: 'center', color: '#4F46E5' }}>Criar conta</Link>
      <Link to="/forgot-password" style={{ textAlign: 'center', color: '#4F46E5' }}>Esqueci a senha</Link>
    </form>
  );
}
