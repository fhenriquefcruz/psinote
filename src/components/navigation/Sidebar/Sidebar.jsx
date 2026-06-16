import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, FileText, BarChart, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import styles from './Sidebar.module.css';

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
    <aside className={styles.sidebar}>
      <div className={styles.logo}>🧠 PsiNote</div>
      <nav>
        {links.map(link => (
          <NavLink key={link.to} to={link.to} className={({ isActive }) => isActive ? styles.active : ''}>
            <link.icon size={20} />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
      <button onClick={logout} className={styles.logout}><LogOut size={20} /> Sair</button>
    </aside>
  );
}
