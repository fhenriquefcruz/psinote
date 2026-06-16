import { useTheme } from '../../../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Alternar tema"
      style={{
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.4rem 0.6rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        color: 'var(--text-secondary)',
        transition: 'var(--transition)'
      }}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>
        {theme === 'dark' ? 'Claro' : 'Escuro'}
      </span>
    </button>
  );
}
