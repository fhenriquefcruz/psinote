import { useAuth } from '../../../hooks/useAuth';
import SearchBar from '../../common/SearchBar/SearchBar';
import ThemeToggle from '../../common/ThemeToggle/ThemeToggle';

export default function Header() {
  const { userProfile } = useAuth();

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.6rem 1.5rem',
      background: 'var(--bg-primary)',
      borderBottom: '1px solid var(--border-color)',
      height: '64px'
    }}>
      <SearchBar />
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <ThemeToggle />
        <span style={{
          fontWeight: 500,
          color: 'var(--text-primary)',
          fontSize: '0.875rem'
        }}>
          {userProfile?.name || 'Usuário'}
        </span>
      </div>
    </header>
  );
}
