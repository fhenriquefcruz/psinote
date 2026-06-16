export default function EmptyState({ message }) {
  return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>{message || 'Nenhum item encontrado'}</div>;
}
