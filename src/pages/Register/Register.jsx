import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(name, email, password);
      toast.success('Conta criada com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Erro ao criar conta: ' + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
      <input
        type="text"
        placeholder="Nome completo"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        style={{ padding: '0.6rem', border: '1px solid #ccc', borderRadius: '6px' }}
      />
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
        Cadastrar
      </button>
      <Link to="/login" style={{ textAlign: 'center', color: '#4F46E5' }}>Já tenho conta</Link>
    </form>
  );
}
