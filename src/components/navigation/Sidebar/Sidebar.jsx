import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, FileText, BarChart, Settings, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

export default function Sidebar({ isOpen, onClose }) {
  const { logout, isAdmin } = useAuth();

  const links = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/patients', icon: Users, label: 'Pacientes' },
    { to: '/agenda', icon: Calendar, label: 'Agenda' },
    { to: '/documents', icon: FileText, label: 'Documentos' },
    { to: '/reports', icon: BarChart, label: 'Relatórios' },
    { to: '/settings', icon: Settings, label: 'Configurações' },
  ];

  const adminLink = isAdmin ? [{ to: '/admin', icon: Shield, label: 'Administração' }] : [];
  const allLinks = [...links, ...adminLink];

  const handleLogout = () => {
    logout();
    if (onClose) onClose();
  };

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 999,
            display: 'block'
          }}
        />
      )}

      <aside
        style={{
          position: isOpen ? 'fixed' : 'sticky',
          top: 0,
          left: 0,
          width: '240px',
          height: '100vh',
          background: 'var(--bg-primary)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          padding: '1rem 0',
          zIndex: 1000,
          transition: 'transform 0.3s ease',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
        className="sidebar-desktop"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 1rem', marginBottom: '2rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>PsiNote</div>
          <button
            onClick={onClose}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
            }}
            className="close-mobile"
          >
            ✕
          </button>
        </div>

        <nav style={{ flex: 1 }}>
          {allLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.8rem',
                padding: '0.7rem 1rem',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isActive ? 'var(--bg-secondary)' : 'transparent',
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
          onClick={handleLogout}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem',
            padding: '0.7rem 1rem',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            marginTop: 'auto'
          }}
        >
          <LogOut size={20} /> Sair
        </button>
      </aside>
    </>
  );
}
