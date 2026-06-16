import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getPatients, archivePatient, restorePatient, deletePatient } from '../../services/patientService';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function Patients() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [filter, setFilter] = useState('active');
  const [loading, setLoading] = useState(true);

  const loadPatients = async () => {
    setLoading(true);
    const list = await getPatients(user.uid, filter);
    setPatients(list);
    setLoading(false);
  };

  useEffect(() => {
    loadPatients();
  }, [user, filter]);

  const handleArchive = async (id) => {
    if (window.confirm('Arquivar este paciente?')) {
      await archivePatient(id, user.uid);
      toast.success('Paciente arquivado');
      loadPatients();
    }
  };

  const handleRestore = async (id) => {
    await restorePatient(id, user.uid);
    toast.success('Paciente restaurado');
    loadPatients();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Excluir permanentemente? Isso enviará para a lixeira.')) {
      await deletePatient(id, user.uid);
      toast.success('Paciente enviado para lixeira');
      loadPatients();
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>Pacientes</h1>
        <div>
          <Link to="/patients/new" style={linkButtonStyle}>+ Novo Paciente</Link>
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => setFilter('active')} style={filterButtonStyle(filter === 'active')}>Ativos</button>
        <button onClick={() => setFilter('archived')} style={filterButtonStyle(filter === 'archived')}>Arquivados</button>
        <button onClick={() => setFilter('deleted')} style={filterButtonStyle(filter === 'deleted')}>Lixeira</button>
      </div>

      {loading ? (
        <div>Carregando...</div>
      ) : patients.length === 0 ? (
        <div>Nenhum paciente encontrado.</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {patients.map(p => (
            <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #e2e8f0' }}>
              <Link to={`/patients/${p.id}`} style={{ textDecoration: 'none', color: '#0f172a' }}>
                <strong>{p.name}</strong>
              </Link>
              <div>
                {filter === 'active' && (
                  <>
                    <Link to={`/patients/edit/${p.id}`} style={actionButtonStyle}>Editar</Link>
                    <button onClick={() => handleArchive(p.id)} style={actionButtonStyle}>Arquivar</button>
                  </>
                )}
                {filter === 'archived' && (
                  <button onClick={() => handleRestore(p.id)} style={actionButtonStyle}>Restaurar</button>
                )}
                {filter === 'deleted' && (
                  <button onClick={() => handleDelete(p.id)} style={{ ...actionButtonStyle, color: '#ef4444' }}>Excluir</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const linkButtonStyle = {
  background: '#4F46E5',
  color: '#fff',
  padding: '0.5rem 1rem',
  borderRadius: '6px',
  textDecoration: 'none'
};

const filterButtonStyle = (active) => ({
  padding: '0.4rem 1rem',
  marginRight: '0.5rem',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  background: active ? '#4F46E5' : '#fff',
  color: active ? '#fff' : '#0f172a',
  cursor: 'pointer'
});

const actionButtonStyle = {
  marginLeft: '0.5rem',
  background: 'none',
  border: 'none',
  color: '#4F46E5',
  cursor: 'pointer',
  textDecoration: 'underline'
};
