import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'react-toastify';
import { Shield, User, CheckCircle, XCircle, Ban, Unlock } from 'lucide-react';

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

  const handleBlockToggle = async (uid, currentlyBlocked) => {
    setUpdating(uid);
    try {
      const userRef = doc(db, 'users', uid);
      const newBlocked = !currentlyBlocked;
      await updateDoc(userRef, { blocked: newBlocked });
      setUsers(prev => prev.map(u => u.id === uid ? { ...u, blocked: newBlocked } : u));
      toast.success(newBlocked ? 'Usuário bloqueado!' : 'Usuário desbloqueado!');
    } catch (error) {
      toast.error('Erro ao alterar bloqueio: ' + error.message);
    } finally {
      setUpdating(null);
    }
  };

  if (!isAdmin) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Acesso restrito a administradores.</div>;
  }

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando usuários...</div>;

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <Shield size={28} color="#4F46E5" />
        <h1 style={{ margin: 0 }}>Painel de Administração</h1>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Gerencie os usuários da plataforma. Apenas administradores podem alterar papéis e bloquear/desbloquear acessos.
      </p>

      <div style={{ 
        background: 'var(--bg-primary)', 
        borderRadius: 'var(--radius)', 
        border: '1px solid var(--border-color)', 
        overflowX: 'auto' // responsividade: scroll horizontal se necessário
      }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          minWidth: '700px' // garante que não fique muito espremido
        }}>
          <thead style={{ background: 'var(--bg-tertiary)' }}>
            <tr>
              <th style={{ padding: '0.8rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Nome</th>
              <th style={{ padding: '0.8rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>E-mail</th>
              <th style={{ padding: '0.8rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Papel</th>
              <th style={{ padding: '0.8rem', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Status</th>
              <th style={{ padding: '0.8rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderTop: '1px solid var(--border-color)', opacity: u.blocked ? 0.6 : 1 }}>
                <td style={{ padding: '0.8rem', verticalAlign: 'middle' }}>{u.name || 'Não informado'}</td>
                <td style={{ padding: '0.8rem', verticalAlign: 'middle' }}>{u.email}</td>
                <td style={{ padding: '0.8rem', verticalAlign: 'middle' }}>
                  <span style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    background: u.role === 'admin' ? '#EEF2FF' : '#F3F4F6',
                    color: u.role === 'admin' ? '#4F46E5' : '#6B7280',
                    whiteSpace: 'nowrap'
                  }}>
                    {u.role === 'admin' ? 'Administrador' : 'Usuário'}
                  </span>
                </td>
                <td style={{ padding: '0.8rem', verticalAlign: 'middle', textAlign: 'center' }}>
                  <span style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    background: u.blocked ? '#FEF2F2' : '#ECFDF5',
                    color: u.blocked ? '#EF4444' : '#10B981',
                    whiteSpace: 'nowrap',
                    display: 'inline-block'
                  }}>
                    {u.blocked ? '🔒 Inativo' : '✅ Ativo'}
                  </span>
                </td>
                <td style={{ padding: '0.8rem', verticalAlign: 'middle', textAlign: 'right' }}>
                  {u.id !== user.uid ? (
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleRoleChange(u.id, 'admin')}
                          disabled={updating === u.id}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#4F46E5',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.8rem',
                            whiteSpace: 'nowrap'
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
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.8rem',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <User size={14} /> Remover Admin
                        </button>
                      )}
                      <button
                        onClick={() => handleBlockToggle(u.id, u.blocked || false)}
                        disabled={updating === u.id}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: u.blocked ? '#10B981' : '#EF4444',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontSize: '0.8rem',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {u.blocked ? <Unlock size={14} /> : <Ban size={14} />}
                        {u.blocked ? 'Desbloquear' : 'Bloquear'}
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>(Você)</span>
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
