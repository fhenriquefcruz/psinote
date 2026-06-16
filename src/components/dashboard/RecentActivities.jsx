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

  // Ordenar por timestamp (mais recente primeiro)
  const sorted = [...activities].sort((a, b) => {
    let dateA, dateB;
    // Verifica se é Timestamp do Firestore
    if (a.timestamp && typeof a.timestamp === 'object' && a.timestamp.toDate) {
      dateA = a.timestamp.toDate();
    } else {
      dateA = new Date(a.timestamp);
    }
    if (b.timestamp && typeof b.timestamp === 'object' && b.timestamp.toDate) {
      dateB = b.timestamp.toDate();
    } else {
      dateB = new Date(b.timestamp);
    }
    return dateB - dateA;
  });

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
        {sorted.map((a, index) => {
          let formattedDate;
          if (a.timestamp && typeof a.timestamp === 'object' && a.timestamp.toDate) {
            formattedDate = a.timestamp.toDate().toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            });
          } else {
            formattedDate = new Date(a.timestamp).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            });
          }
          return (
            <li
              key={a.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem 0',
                borderBottom: index < sorted.length - 1 ? '1px solid var(--border-color)' : 'none',
                fontSize: '0.875rem'
              }}
            >
              <span style={{ color: 'var(--text-primary)' }}>{a.action}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {formattedDate}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
