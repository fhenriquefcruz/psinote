import { Users, UserCheck, Archive, Calendar, TrendingUp } from 'lucide-react';

export default function StatsCards({ stats }) {
  const cards = [
    { 
      title: 'Total de Pacientes', 
      value: stats.totalPatients, 
      icon: Users, 
      gradient: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
      bg: 'linear-gradient(135deg, #EEF2FF, #EDE9FE)',
      iconColor: '#4F46E5'
    },
    { 
      title: 'Pacientes Ativos', 
      value: stats.activePatients, 
      icon: UserCheck, 
      gradient: 'linear-gradient(135deg, #10B981, #059669)',
      bg: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
      iconColor: '#10B981'
    },
    { 
      title: 'Pacientes Arquivados', 
      value: stats.archivedPatients, 
      icon: Archive, 
      gradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
      bg: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)',
      iconColor: '#F59E0B'
    },
    { 
      title: 'Sessões no Mês', 
      value: stats.sessionsThisMonth, 
      icon: Calendar, 
      gradient: 'linear-gradient(135deg, #EF4444, #DC2626)',
      bg: 'linear-gradient(135deg, #FEF2F2, #FECACA)',
      iconColor: '#EF4444'
    },
    { 
      title: 'Sessões no Ano', 
      value: stats.sessionsThisYear, 
      icon: TrendingUp, 
      gradient: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
      bg: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)',
      iconColor: '#8B5CF6'
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '1rem'
    }}>
      {cards.map((card, index) => (
        <div
          key={index}
          style={{
            background: 'var(--bg-primary)',
            padding: '1.2rem 1.2rem 1rem 1.2rem',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            cursor: 'default',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
            <div style={{
              background: card.bg,
              padding: '0.6rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <card.icon size={22} color={card.iconColor} />
            </div>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.03em'
            }}>
              {card.title}
            </span>
          </div>
          <div style={{
            fontSize: '2rem',
            fontWeight: 700,
            background: card.gradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.02em'
          }}>
            {card.value}
          </div>
          {/* Barra de progresso sutil no final */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: card.gradient,
            opacity: 0.2
          }} />
        </div>
      ))}
    </div>
  );
}
