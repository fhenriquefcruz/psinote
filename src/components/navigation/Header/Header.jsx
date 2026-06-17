import { Menu } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import SearchBar from '../../common/SearchBar/SearchBar';
import ThemeToggle from '../../common/ThemeToggle/ThemeToggle';

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
        {/* Botão hambúrguer: visível APENAS em telas pequenas */}
        <button
          onClick={onMenuClick}
          aria-label="Abrir menu"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            padding: '0.2rem',
            display: 'block', // padrão para mobile
            '@media (min-width: 769px)': {
              display: 'none' // some em telas grandes
            }
          }}
          className="menu-button"
        >
          <Menu size={24} />
        </button>
        <span
          style={{
            fontWeight: 'bold',
            fontSize: '1.2rem',
            color: 'var(--text-primary)',
            display: 'block'
          }}
        >
          PsiNote
        </span>
      </div>

      <SearchBar />

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <ThemeToggle />
        <span
          style={{
            fontWeight: 500,
            color: 'var(--text-primary)',
            fontSize: '0.875rem'
          }}
        >
          {userProfile?.name || 'Usuário'}
        </span>
      </div>
    </header>
  );
}
