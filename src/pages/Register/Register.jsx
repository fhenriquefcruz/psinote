import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import styles from '../AuthForm.module.css';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      await register(name, email, password);
      toast.success('Conta criada com sucesso!');
      navigate('/dashboard');
    } catch {
      toast.error('Não foi possível criar a conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div>
        <h1 className={styles.heading}>Criar conta</h1>
        <p className={styles.description}>
          Cadastre uma conta profissional para começar.
        </p>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="register-name">Nome completo</label>
        <input
          id="register-name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          className={styles.input}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="register-email">E-mail</label>
        <input
          id="register-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className={styles.input}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="register-password">Senha</label>
        <input
          id="register-password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          className={styles.input}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className={styles.primaryButton}
      >
        {loading ? 'Criando...' : 'Cadastrar'}
      </button>

      <div className={styles.links}>
        <Link to="/login">Já tenho conta</Link>
      </div>
    </form>
  );
}
