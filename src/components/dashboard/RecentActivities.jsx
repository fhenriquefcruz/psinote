import { Clock } from 'lucide-react';

export default function RecentActivities({ activities }) {
  if (!activities || activities.length === 0) {
    return (
      <div style={{
        background: 'var(--bg-primary)',
        padding: '1.5rem',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border-color)',
        textAlign: 'center',
        color: 'var(--text-muted)'
      }}>
        <Clock size={20} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
        <p>Nenhuma atividade recente</p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--bg-primary)',
      padding: '1.5rem',
      borderRadius: 'var(--radius)',
      border: '1px solid var(--border-color)'
    }}>
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
        🕐 Atividades Recentes
      </h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {activities.map((a, index) => (
          <li
            key={a.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.5rem 0',
              borderBottom: index < activities.length - 1 ? '1px solid var(--border-color)' : 'none',
              fontSize: '0.875rem'
            }}
          >
            <span style={{ color: 'var(--text-primary)' }}>{a.action}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {new Date(a.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
