import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useAuth } from '../../hooks/useAuth';
import { auth } from '../../firebase/config';
import styles from '../AuthForm.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Login realizado!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Falha ao autenticar');
      toast.error('Não foi possível entrar. Revise as credenciais e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();

    try {
      await signInWithPopup(auth, provider);
      toast.success('Login com Google realizado!');
      navigate('/dashboard');
    } catch {
      toast.error('Não foi possível concluir o login com Google.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div>
        <h1 className={styles.heading}>Entrar no PsiNote</h1>
        <p className={styles.description}>
          Acesse sua rotina profissional com sua conta.
        </p>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="login-email">E-mail</label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className={styles.input}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="login-password">Senha</label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
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
        {loading ? 'Entrando...' : 'Entrar'}
      </button>

      <div className={styles.divider} aria-hidden="true">ou</div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        className={styles.googleButton}
      >
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        Entrar com Google
      </button>

      <div className={styles.links}>
        <Link to="/register">Criar conta</Link>
        <Link to="/forgot-password">Esqueci a senha</Link>
      </div>
    </form>
  );
}
