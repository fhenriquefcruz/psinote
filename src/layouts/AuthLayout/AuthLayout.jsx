import { Outlet } from 'react-router-dom';
import Logo from '../../components/common/Logo/Logo';

export default function AuthLayout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)' }}>
      <div style={{ background: 'var(--bg-primary)', padding: '2rem', borderRadius: '12px', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <Logo size="lg" />
        </div>
        <Outlet />
      </div>
    </div>
  );
}
