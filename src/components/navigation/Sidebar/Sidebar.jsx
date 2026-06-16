import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, FileText, BarChart, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

export default function Sidebar() {
  const { logout } = useAuth();
  const links = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/patients', icon: Users, label: 'Pacientes' },
    { to: '/agenda', icon: Calendar, label: 'Agenda' },
    { to: '/documents', icon: FileText, label: 'Documentos' },
    { to: '/reports', icon: BarChart, label: 'Relatórios' },
    { to: '/settings', icon: Settings, label: 'Configurações' },
  ];

  return (
    <aside style={{ width: '220px', background: 'var(--bg-primary, #fff)', borderRight: '1px solid var(--border-color, #e2e8f0)', display: 'flex', flexDirection: 'column', padding: '1rem 0', height: '100vh' }}>
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', padding: '0 1rem', marginBottom: '2rem', color: 'var(--text-primary, #0f172a)' }}>🧠 PsiNote</div>
      <nav style={{ flex: 1 }}>
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.8rem',
              padding: '0.7rem 1rem',
              color: isActive ? 'var(--text-primary, #0f172a)' : 'var(--text-secondary, #475569)',
              background: isActive ? 'var(--bg-secondary, #f1f5f9)' : 'transparent',
              textDecoration: 'none',
              transition: '0.2s'
            })}
          >
            <link.icon size={20} />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
      <button
        onClick={logout}
        style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.7rem 1rem', cursor: 'pointer', color: 'var(--text-secondary, #475569)' }}
      >
        <LogOut size={20} /> Sair
      </button>
    </aside>
  );
}
