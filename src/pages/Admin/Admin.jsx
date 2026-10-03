import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { Shield, LockKeyhole, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase/config';

export default function Admin() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState(/** @type {AdminAccountRecord[]} */ ([]));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    const loadUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        setUsers(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
      } catch {
        toast.error('Não foi possível carregar os usuários.');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Acesso restrito.
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Carregando usuários...
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
        <Shield size={28} aria-hidden="true" />
        <h1 style={{ margin: 0 }}>Administração</h1>
      </div>

      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Visão administrativa de contas. Alterações de papel, bloqueio e ciclo de vida da conta
        estão fechadas no navegador e serão executadas apenas por backend privilegiado.
      </p>

      <div
        role="status"
        style={{
          display: 'flex',
          gap: '0.7rem',
          alignItems: 'flex-start',
          padding: '1rem',
          marginBottom: '1.5rem',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius)',
          background: 'var(--bg-tertiary)'
        }}
      >
        <LockKeyhole size={20} aria-hidden="true" />
        <div>
          <strong>Modo seguro de transição</strong>
          <p style={{ margin: '0.2rem 0 0' }}>
            O PsiNote não permite mais promover administradores ou bloquear contas por uma
            escrita direta do frontend.
          </p>
        </div>
      </div>

      <div
        style={{
          background: 'var(--bg-primary)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border-color)',
          overflowX: 'auto'
        }}
      >
        <div style={{ padding: '0.9rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Users size={18} aria-hidden="true" />
          <strong>{users.length} conta(s)</strong>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '620px' }}>
          <thead style={{ background: 'var(--bg-tertiary)' }}>
            <tr>
              <th scope="col" style={headerCellStyle}>Nome</th>
              <th scope="col" style={headerCellStyle}>E-mail</th>
              <th scope="col" style={headerCellStyle}>Perfil informativo</th>
              <th scope="col" style={headerCellStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((account) => (
              <tr key={account.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                <td style={cellStyle}>{account.name || 'Não informado'}</td>
                <td style={cellStyle}>{account.email || 'Não informado'}</td>
                <td style={cellStyle}>{account.role || 'user'}</td>
                <td style={cellStyle}>{account.blocked ? 'Bloqueado' : 'Ativo'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** @type {import('react').CSSProperties} */
const headerCellStyle = {
  padding: '0.8rem',
  textAlign: 'left',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  whiteSpace: 'nowrap'
};

/** @type {import('react').CSSProperties} */
const cellStyle = {
  padding: '0.8rem',
  verticalAlign: 'middle',
  color: 'var(--text-primary)'
};
