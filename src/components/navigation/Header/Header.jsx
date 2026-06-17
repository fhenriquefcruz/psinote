import { Menu } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import SearchBar from '../../common/SearchBar/SearchBar';
import ThemeToggle from '../../common/ThemeToggle/ThemeToggle';
import Logo from '../../common/Logo/Logo';

export default function Header({ onMenuClick }) {
  const { userProfile } = useAuth();

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.6rem 1.5rem',
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-color)',
        height: '64px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
        <button
          onClick={onMenuClick}
          className="menu-button"
          aria-label="Abrir menu"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            padding: '0.2rem'
          }}
        >
          <Menu size={24} />
        </button>
        <Logo size="sm" />
      </div>

      <SearchBar />

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <ThemeToggle />
        <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
          {userProfile?.name || 'Usuário'}
        </span>
      </div>
    </header>
  );
}
