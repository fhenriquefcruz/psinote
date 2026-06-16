export default function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'var(--bg-primary, #fff)', padding: '2rem', borderRadius: '8px', maxWidth: '500px', width: '100%' }}>
        {children}
        <button onClick={onClose} style={{ marginTop: '1rem', padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer', background: '#ef4444', color: '#fff' }}>Fechar</button>
      </div>
    </div>
  );
}
