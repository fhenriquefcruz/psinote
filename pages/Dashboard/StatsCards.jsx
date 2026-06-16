import { Users, UserPlus, Archive, Calendar, TrendingUp } from 'lucide-react';
import styles from './StatsCards.module.css';

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
    <div className={styles.grid}>
      {cards.map((card, index) => (
        <div key={index} className={styles.card}>
          <div className={styles.iconWrapper} style={{ backgroundColor: `${card.color}20` }}>
            <card.icon size={24} color={card.color} />
          </div>
          <div className={styles.content}>
            <span className={styles.title}>{card.title}</span>
            <span className={styles.value}>{card.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
