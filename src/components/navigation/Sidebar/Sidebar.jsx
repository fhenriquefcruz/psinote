import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  NotebookPen,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import Logo from '../../common/Logo/Logo';
import styles from './Sidebar.module.css';

const navigationGroups = [
  {
    label: 'Hoje',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Visão do dia' },
      { to: '/agenda', icon: CalendarDays, label: 'Agenda' }
    ]
  },
  {
    label: 'Atendimento',
    items: [
      { to: '/patients', icon: Users, label: 'Pacientes' },
      { to: '/sessions', icon: NotebookPen, label: 'Sessões' }
    ]
  },
  {
    label: 'Documentação',
    items: [
      { to: '/documents', icon: FileText, label: 'Documentos' },
      { to: '/reports', icon: BarChart3, label: 'Relatórios' }
    ]
  },
  {
    label: 'Gestão',
    items: [
      { to: '/settings', icon: Settings, label: 'Configurações' }
    ]
  }
];

export default function Sidebar({ isOpen, onClose }) {
  const { logout, isAdmin } = useAuth();

  const handleLogout = async () => {
    await logout();
    onClose?.();
  };

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className={styles.overlay}
          onClick={onClose}
          aria-label="Fechar menu"
        />
      )}

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`} aria-label="Navegação principal">
        <div className={styles.header}>
          <Logo size="md" />
          <button type="button" onClick={onClose} className={styles.closeButton} aria-label="Fechar menu">
            ×
          </button>
        </div>

        <nav className={styles.nav}>
          {navigationGroups.map((group) => (
            <div key={group.label} className={styles.group}>
              <div className={styles.groupLabel}>{group.label}</div>
              <div className={styles.groupItems}>
                {group.items.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `${styles.navLink} ${isActive ? styles.active : ''}`
                    }
                  >
                    <link.icon size={18} strokeWidth={1.8} aria-hidden="true" />
                    <span>{link.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}

          {isAdmin && (
            <div className={styles.group}>
              <div className={styles.groupLabel}>Administração</div>
              <div className={styles.groupItems}>
                <NavLink
                  to="/admin"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.active : ''}`
                  }
                >
                  <ShieldCheck size={18} strokeWidth={1.8} aria-hidden="true" />
                  <span>Administração</span>
                </NavLink>
              </div>
            </div>
          )}
        </nav>

        <button type="button" onClick={handleLogout} className={styles.logoutButton}>
          <LogOut size={18} strokeWidth={1.8} aria-hidden="true" />
          <span>Sair</span>
        </button>
      </aside>
    </>
  );
}
