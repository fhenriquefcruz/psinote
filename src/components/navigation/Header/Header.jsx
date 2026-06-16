import { useAuth } from '../../../hooks/useAuth';
import SearchBar from '../../common/SearchBar/SearchBar';

export default function Header() {
  const { userProfile } = useAuth();
  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1.5rem', background: 'var(--bg-primary, #fff)', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
      <SearchBar />
      <div style={{ fontWeight: '500', color: 'var(--text-primary, #0f172a)' }}>
        {userProfile?.name || 'Usuário'}
      </div>
    </header>
  );
}
