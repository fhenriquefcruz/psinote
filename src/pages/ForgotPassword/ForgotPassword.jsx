import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await resetPassword(email);
      toast.success('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
    } catch (error) {
      toast.error('Erro ao enviar e-mail: ' + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
      <input
        type="email"
        placeholder="Seu e-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        style={{ padding: '0.6rem', border: '1px solid #ccc', borderRadius: '6px' }}
      />
      <button
        type="submit"
        style={{ padding: '0.6rem', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
      >
        Recuperar senha
      </button>
      <Link to="/login" style={{ textAlign: 'center', color: '#4F46E5' }}>Voltar ao login</Link>
    </form>
  );
}
