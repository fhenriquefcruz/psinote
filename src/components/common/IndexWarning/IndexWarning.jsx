import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function IndexWarning() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('indexWarningDismissed');
    if (stored) setDismissed(true);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('indexWarningDismissed', 'true');
  };

  if (dismissed) return null;

  return (
    <div style={{
      background: '#FEF3C7',
      border: '1px solid #F59E0B',
      borderRadius: 'var(--radius-sm)',
      padding: '0.8rem 1rem',
      marginBottom: '1.5rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '0.5rem',
      flexWrap: 'wrap'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <AlertTriangle size={18} color="#F59E0B" />
        <span style={{ fontSize: '0.875rem', color: '#78350F' }}>
          <strong>Aviso:</strong> Algumas funcionalidades (Agenda, Documentos) podem não estar disponíveis até que os índices do Firestore sejam criados.
          <a href="https://console.firebase.google.com/v1/r/project/psinotee/firestore/indexes?create_composite=Ck1wcm9qZWN0cy9wc2lub3RlZS9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvYXBwb2ludG1lbnRzL2luZGV4ZXMvXxABGhIKDnBzeWNob2xvZ2lzdElkEAEaCAoEZGF0ZRABGgwKCF9fbmFtZV9fEAE" target="_blank" rel="noopener noreferrer" style={{ color: '#4F46E5', fontWeight: 500, marginLeft: '0.3rem' }}>
            Clique aqui para criar
          </a>
        </span>
      </div>
      <button onClick={handleDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#78350F', padding: '0.2rem' }}>
        <X size={18} />
      </button>
    </div>
  );
}
