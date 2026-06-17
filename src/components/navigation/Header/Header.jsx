import { Menu } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import SearchBar from '../../common/SearchBar/SearchBar';
import ThemeToggle from '../../common/ThemeToggle/ThemeToggle';

export default function Header({ onMenuClick }) {
  const { userProfile } = useAuth();

  return (
    <header className="header">
      <div className="header-left">
        <button
          onClick={onMenuClick}
          className="menu-button"
          aria-label="Abrir menu"
        >
          <Menu size={24} />
        </button>
        <span className="logo-mobile">PsiNote</span>
      </div>

      <SearchBar />

      <div className="header-right">
        <ThemeToggle />
        <span className="user-name">{userProfile?.name || 'Usuário'}</span>
      </div>
    </header>
  );
}
