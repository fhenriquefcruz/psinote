import { Users, UserCheck, Archive, Calendar, TrendingUp } from 'lucide-react';

export default function StatsCards({ stats }) {
  const cards = [
    { title: 'Total de Pacientes', value: stats.totalPatients, icon: Users, color: '#4F46E5', bgColor: '#EEF2FF' },
    { title: 'Pacientes Ativos', value: stats.activePatients, icon: UserCheck, color: '#10B981', bgColor: '#ECFDF5' },
    { title: 'Pacientes Arquivados', value: stats.archivedPatients, icon: Archive, color: '#F59E0B', bgColor: '#FFFBEB' },
    { title: 'Sessões no Mês', value: stats.sessionsThisMonth, icon: Calendar, color: '#EF4444', bgColor: '#FEF2F2' },
    { title: 'Sessões no Ano', value: stats.sessionsThisYear, icon: TrendingUp, color: '#8B5CF6', bgColor: '#F5F3FF' }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
      {cards.map((card, index) => (
        <div key={index} style={{ background: 'var(--bg-primary)', padding: '1.2rem 1.2rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', transition: 'var(--transition)', cursor: 'default' }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
            <div style={{ background: card.bgColor, padding: '0.5rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <card.icon size={20} color={card.color} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{card.title}</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{card.value}</div>
        </div>
      ))}
    </div>
  );
}
