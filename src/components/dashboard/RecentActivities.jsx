export default function RecentActivities({ activities }) {
  if (!activities || activities.length === 0) return <div>Nenhuma atividade recente</div>;
  return (
    <ul>
      {activities.map(a => <li key={a.id}>{a.action} - {a.timestamp}</li>)}
    </ul>
  );
}
