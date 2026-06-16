export default function RecentActivities({ activities }) {
  if (!activities || activities.length === 0) {
    return <div style={{ padding: '1rem', color: 'var(--text-secondary, #475569)' }}>Nenhuma atividade recente</div>;
  }
  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {activities.map(a => (
        <li key={a.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
          {a.action} - {a.timestamp}
        </li>
      ))}
    </ul>
  );
}
