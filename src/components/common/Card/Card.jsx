export default function Card({ children }) {
  return <div style={{ background: 'var(--bg-primary, #fff)', padding: '1rem', borderRadius: '8px', boxShadow: 'var(--card-shadow, 0 1px 3px rgba(0,0,0,0.1))' }}>{children}</div>;
}
