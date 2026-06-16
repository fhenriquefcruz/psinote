import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getPatients, archivePatient, restorePatient, deletePatient, getTrashPatients } from '../../services/patientService';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Trash2, Archive, RotateCcw, ChevronLeft, ChevronRight, CheckSquare, Square } from 'lucide-react';

export default function Patients() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [filter, setFilter] = useState('active');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const loadPatients = async () => {
    setLoading(true);
    const list = await getPatients(user.uid, filter);
    setPatients(list);
    setSelected([]);
    setSelectAll(false);
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

  const handleDeletePermanent = async (id) => {
    if (window.confirm('Excluir permanentemente este paciente? Esta ação não pode ser desfeita.')) {
      await deletePatient(id, user.uid);
      toast.success('Paciente excluído permanentemente');
      loadPatients();
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelected([]);
    } else {
      setSelected(patients.map(p => p.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) return;
    if (window.confirm(`Excluir permanentemente ${selected.length} paciente(s)? Esta ação não pode ser desfeita.`)) {
      for (const id of selected) {
        await deletePatient(id, user.uid);
      }
      toast.success(`${selected.length} paciente(s) excluído(s)`);
      loadPatients();
    }
  };

  const getDaysInTrash = (deletedAt) => {
    if (!deletedAt) return 0;
    const days = Math.floor((Date.now() - deletedAt.toDate?.()?.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Carregando...</div>;

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 style={{ margin: 0 }}>Pacientes</h1>
        <Link to="/patients/new" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'var(--primary)', color: '#fff', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontWeight: 500, transition: 'var(--transition)' }}>
          + Novo Paciente
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button onClick={() => setFilter('active')} style={{ padding: '0.3rem 0.8rem', borderRadius: '20px', border: filter === 'active' ? '2px solid var(--primary)' : '1px solid var(--border-color)', background: filter === 'active' ? 'var(--primary-light)' : 'transparent', color: filter === 'active' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: filter === 'active' ? 600 : 400 }}>
          Ativos
        </button>
        <button onClick={() => setFilter('archived')} style={{ padding: '0.3rem 0.8rem', borderRadius: '20px', border: filter === 'archived' ? '2px solid var(--primary)' : '1px solid var(--border-color)', background: filter === 'archived' ? 'var(--primary-light)' : 'transparent', color: filter === 'archived' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: filter === 'archived' ? 600 : 400 }}>
          Arquivados
        </button>
        <button onClick={() => setFilter('deleted')} style={{ padding: '0.3rem 0.8rem', borderRadius: '20px', border: filter === 'deleted' ? '2px solid var(--primary)' : '1px solid var(--border-color)', background: filter === 'deleted' ? 'var(--primary-light)' : 'transparent', color: filter === 'deleted' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: filter === 'deleted' ? 600 : 400 }}>
          Lixeira 🗑️
        </button>
      </div>

      {filter === 'deleted' && (
        <div style={{ background: 'var(--bg-tertiary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          ⏳ Os pacientes permanecem na lixeira por 30 dias. Após esse período, serão removidos automaticamente.
          {patients.length > 0 && (
            <span style={{ marginLeft: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              ({patients.length} paciente(s) na lixeira)
            </span>
          )}
        </div>
      )}

      {filter === 'deleted' && patients.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button onClick={handleSelectAll} style={{ background: 'none', border: '1px solid var(--border-color)', padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {selectAll ? <CheckSquare size={16} /> : <Square size={16} />}
            {selectAll ? 'Desmarcar todos' : 'Selecionar todos'}
          </button>
          {selected.length > 0 && (
            <button onClick={handleBulkDelete} style={{ background: 'var(--danger)', color: '#fff', border: 'none', padding: '0.3rem 0.8rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}>
              <Trash2 size={14} /> Excluir {selected.length} selecionado(s)
            </button>
          )}
        </div>
      )}

      {patients.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Nenhum paciente encontrado.</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {patients.map(p => {
            const isSelected = selected.includes(p.id);
            const daysInTrash = filter === 'deleted' ? getDaysInTrash(p.deletedAt) : 0;
            const remainingDays = Math.max(0, 30 - daysInTrash);
            return (
              <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', background: isSelected ? 'var(--primary-light)' : 'transparent', borderRadius: 'var(--radius-sm)', borderBottom: '1px solid var(--border-color)', transition: 'var(--transition)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flex: 1 }}>
                  {filter === 'deleted' && (
                    <button onClick={() => handleSelect(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isSelected ? 'var(--primary)' : 'var(--text-muted)' }}>
                      {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                  )}
                  <Link to={`/patients/${p.id}`} style={{ textDecoration: 'none', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {p.name}
                  </Link>
                  {filter === 'deleted' && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                      🕒 {remainingDays} dias restantes
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                  {filter === 'active' && (
                    <>
                      <Link to={`/patients/edit/${p.id}`} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', padding: '0.2rem 0.4rem' }}>Editar</Link>
                      <button onClick={() => handleArchive(p.id)} style={{ background: 'none', border: 'none', color: 'var(--warning)', cursor: 'pointer', fontSize: '0.8rem', padding: '0.2rem 0.4rem' }}>
                        <Archive size={16} />
                      </button>
                    </>
                  )}
                  {filter === 'archived' && (
                    <button onClick={() => handleRestore(p.id)} style={{ background: 'none', border: 'none', color: 'var(--success)', cursor: 'pointer', fontSize: '0.8rem', padding: '0.2rem 0.4rem' }}>
                      <RotateCcw size={16} />
                    </button>
                  )}
                  {filter === 'deleted' && (
                    <button onClick={() => handleDeletePermanent(p.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.8rem', padding: '0.2rem 0.4rem' }}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
