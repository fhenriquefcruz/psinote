import { useState } from 'react';
import { Info } from 'lucide-react';

export default function Tooltip({ text, position = 'top' }) {
  const [visible, setVisible] = useState(false);

  const positions = {
    top: { bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' },
    bottom: { top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' },
    left: { right: 'calc(100% + 8px)', top: '50%', transform: 'translateY(-50%)' },
    right: { left: 'calc(100% + 8px)', top: '50%', transform: 'translateY(-50%)' },
  };

  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <Info
        size={16}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        style={{
          cursor: 'help',
          color: 'var(--text-muted)',
          marginLeft: '0.3rem',
          transition: 'var(--transition)'
        }}
        aria-label="Mais informações"
      />
      {visible && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            ...positions[position],
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            lineHeight: '1.5',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-color)',
            maxWidth: '260px',
            zIndex: 1000,
            textAlign: 'left',
            pointerEvents: 'none'
          }}
        >
          {text}
        </div>
      )}
    </span>
  );
}
