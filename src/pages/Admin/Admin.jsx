import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'react-toastify';
import { Shield, User, CheckCircle, XCircle } from 'lucide-react';

export default function Admin() {
  const { user, userRole, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    if (!isAdmin) {
      toast.error('Acesso negado. Você não é administrador.');
      return;
    }
    const loadUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        const usersList = [];
        snapshot.forEach(doc => {
          usersList.push({ id: doc.id, ...doc.data() });
        });
        setUsers(usersList);
      } catch (error) {
        toast.error('Erro ao carregar usuários: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, [isAdmin]);

  const handleRoleChange = async (uid, newRole) => {
    setUpdating(uid);
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { role: newRole });
      setUsers(prev => prev.map(u => u.id === uid ? { ...u, role: newRole } : u));
      toast.success('Papel do usuário atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar papel: ' + error.message);
    } finally {
      setUpdating(null);
    }
  };

  if (!isAdmin) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Acesso restrito a administradores.</div>;
  }

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando usuários...</div>;

  return (
    <div style={{ padding: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <Shield size={28} color="#4F46E5" />
        <h1 style={{ margin: 0 }}>Painel de Administração</h1>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Gerencie os usuários da plataforma. Apenas administradores podem alterar papéis.
      </p>

      <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: 'var(--bg-tertiary)' }}>
            <tr>
              <th style={{ padding: '0.8rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Nome</th>
              <th style={{ padding: '0.8rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>E-mail</th>
              <th style={{ padding: '0.8rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Papel</th>
              <th style={{ padding: '0.8rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.8rem' }}>{u.name || 'Não informado'}</td>
                <td style={{ padding: '0.8rem' }}>{u.email}</td>
                <td style={{ padding: '0.8rem' }}>
                  <span style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    background: u.role === 'admin' ? '#EEF2FF' : '#F3F4F6',
                    color: u.role === 'admin' ? '#4F46E5' : '#6B7280'
                  }}>
                    {u.role === 'admin' ? 'Administrador' : 'Usuário'}
                  </span>
                </td>
                <td style={{ padding: '0.8rem', textAlign: 'right' }}>
                  {u.id !== user.uid && (
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleRoleChange(u.id, 'admin')}
                          disabled={updating === u.id}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#4F46E5',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.8rem'
                          }}
                        >
                          <Shield size={14} /> Tornar Admin
                        </button>
                      )}
                      {u.role === 'admin' && (
                        <button
                          onClick={() => handleRoleChange(u.id, 'user')}
                          disabled={updating === u.id}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#EF4444',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.8rem'
                          }}
                        >
                          <User size={14} /> Remover Admin
                        </button>
                      )}
                    </div>
                  )}
                  {u.id === user.uid && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Você)</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
