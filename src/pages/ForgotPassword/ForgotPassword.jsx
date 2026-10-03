import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import styles from '../AuthForm.module.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      await resetPassword(email);
      toast.success('Solicitação enviada. Verifique sua caixa de entrada.');
    } catch {
      toast.error('Não foi possível solicitar a recuperação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div>
        <h1 className={styles.heading}>Recuperar acesso</h1>
        <p className={styles.description}>
          Informe o e-mail da conta para solicitar a redefinição de senha.
        </p>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="reset-email">E-mail</label>
        <input
          id="reset-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className={styles.input}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className={styles.primaryButton}
      >
        {loading ? 'Enviando...' : 'Recuperar senha'}
      </button>

      <div className={styles.links}>
        <Link to="/login">Voltar ao login</Link>
      </div>
    </form>
  );
}
