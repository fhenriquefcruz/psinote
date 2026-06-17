import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, FileText, BarChart, Settings, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import styles from './Sidebar.module.css';

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
      {/* Overlay para mobile */}
      {isOpen && (
        <div
          className={styles.overlay}
          onClick={onClose}
        />
      )}

      <aside
        className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}
      >
        <div className={styles.header}>
          <span className={styles.logo}>PsiNote</span>
          <button
            onClick={onClose}
            className={styles.closeButton}
          >
            ✕
          </button>
        </div>

        <nav className={styles.nav}>
          {allLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ''}`
              }
            >
              <link.icon size={20} />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <button onClick={handleLogout} className={styles.logoutButton}>
          <LogOut size={20} /> Sair
        </button>
      </aside>
    </>
  );
}
