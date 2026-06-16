import { Users, UserPlus, Archive, Calendar, TrendingUp } from 'lucide-react';

export default function StatsCards({ stats }) {
  const cards = [
    {
      title: 'Total de Pacientes',
      value: stats.totalPatients,
      icon: Users,
      color: '#4F46E5'
    },
    {
      title: 'Pacientes Ativos',
      value: stats.activePatients,
      icon: UserPlus,
      color: '#10B981'
    },
    {
      title: 'Pacientes Arquivados',
      value: stats.archivedPatients,
      icon: Archive,
      color: '#F59E0B'
    },
    {
      title: 'Sessões no Mês',
      value: stats.sessionsThisMonth,
      icon: Calendar,
      color: '#EF4444'
    },
    {
      title: 'Sessões no Ano',
      value: stats.sessionsThisYear,
      icon: TrendingUp,
      color: '#8B5CF6'
    }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
      {cards.map((card, index) => (
        <div
          key={index}
          style={{
            background: 'var(--bg-primary, #fff)',
            padding: '1rem',
            borderRadius: '8px',
            boxShadow: 'var(--card-shadow, 0 1px 3px rgba(0,0,0,0.1))',
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem'
          }}
        >
          <div style={{ backgroundColor: `${card.color}20`, padding: '0.5rem', borderRadius: '8px' }}>
            <card.icon size={24} color={card.color} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary, #475569)' }}>{card.title}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary, #0f172a)' }}>{card.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
