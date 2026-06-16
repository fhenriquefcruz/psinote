import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary, #f1f5f9)' }}>
      <div style={{ background: 'var(--bg-primary, #fff)', padding: '2rem', borderRadius: '12px', boxShadow: 'var(--card-shadow, 0 1px 3px rgba(0,0,0,0.1))', width: '100%', maxWidth: '400px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--text-primary, #0f172a)' }}>🧠 PsiNote</h1>
        <Outlet />
      </div>
    </div>
  );
}
