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
      toast.success('E-mail de recuperação enviado!');
    } catch (error) {
      toast.error('Erro ao enviar e-mail: ' + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <button type="submit">Recuperar senha</button>
      <Link to="/login">Voltar ao login</Link>
    </form>
  );
}
