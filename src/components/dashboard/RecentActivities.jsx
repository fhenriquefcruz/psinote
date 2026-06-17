import { Clock, User, FileText, Calendar, Edit, Trash2, Archive, Upload } from 'lucide-react';

// Mapeia ações para ícones e cores
const actionMap = {
  'Paciente criado': { icon: User, color: '#4F46E5' },
  'Paciente editado': { icon: Edit, color: '#F59E0B' },
  'Paciente arquivado': { icon: Archive, color: '#6B7280' },
  'Paciente restaurado': { icon: Archive, color: '#10B981' },
  'Paciente excluído': { icon: Trash2, color: '#EF4444' },
  'Sessão criada': { icon: Calendar, color: '#4F46E5' },
  'Sessão editada': { icon: Edit, color: '#F59E0B' },
  'Sessão arquivada': { icon: Archive, color: '#6B7280' },
  'Documento enviado': { icon: Upload, color: '#8B5CF6' },
  'Documento removido': { icon: Trash2, color: '#EF4444' },
  'Consulta agendada': { icon: Calendar, color: '#10B981' },
  'Consulta realizada': { icon: Calendar, color: '#10B981' },
  'Consulta cancelada': { icon: Calendar, color: '#EF4444' },
  'Consulta reagendada': { icon: Calendar, color: '#F59E0B' },
};

export default function RecentActivities({ activities }) {
  if (!activities || activities.length === 0) {
    return (
      <div
        style={{
          background: 'var(--bg-primary)',
          padding: '1.5rem',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border-color)',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}
      >
        <Clock size={20} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
        <p>Nenhuma atividade recente</p>
      </div>
    );
  }

  const sorted = [...activities].sort((a, b) => {
    const dateA = new Date(a.timestamp);
    const dateB = new Date(b.timestamp);
    return dateB - dateA;
  });

  return (
    <div
      style={{
        background: 'var(--bg-primary)',
        padding: '1.5rem',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border-color)'
      }}
    >
      <h3
        style={{
          margin: '0 0 1rem 0',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--text-secondary)'
        }}
      >
        🕐 Atividades Recentes
      </h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {sorted.map((a, index) => {
          const meta = actionMap[a.action] || { icon: Clock, color: '#94A3B8' };
          const IconComponent = meta.icon;
          // Extrai nome do paciente dos detalhes, se disponível
          let detailText = '';
          if (a.details?.name) {
            detailText = ` - ${a.details.name}`;
          } else if (a.details?.patientName) {
            detailText = ` - ${a.details.patientName}`;
          } else if (a.details?.fileName) {
            detailText = ` - ${a.details.fileName}`;
          }
          return (
            <li
              key={a.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem 0',
                borderBottom:
                  index < sorted.length - 1 ? '1px solid var(--border-color)' : 'none',
                fontSize: '0.875rem',
                gap: '0.5rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <IconComponent size={16} color={meta.color} />
                <span style={{ color: 'var(--text-primary)' }}>
                  {a.action}
                  {detailText && (
                    <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                      {detailText}
                    </span>
                  )}
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {a.timestamp
                  ? new Date(a.timestamp).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : ''}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
