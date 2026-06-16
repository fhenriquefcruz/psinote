export default function Button({ children, ...props }) {
  return <button {...props} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer', background: '#4F46E5', color: '#fff' }}>{children}</button>;
}
