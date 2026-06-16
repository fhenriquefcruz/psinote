export default function Card({ children }) {
  return <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', boxShadow: 'var(--card-shadow)' }}>{children}</div>;
}
