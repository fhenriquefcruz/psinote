import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getAppointments, createAppointment, updateAppointmentStatus, deleteAppointment } from '../../services/appointmentService';
import { getPatients } from '../../services/patientService';
import { toast } from 'react-toastify';
import { Plus, X, Check, Calendar as CalendarIcon, Clock as ClockIcon } from 'lucide-react';

export default function Agenda() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    date: '',
    time: '',
    duration: 50,
    notes: ''
  });
  const [filter, setFilter] = useState('all');

  const loadData = async () => {
    try {
      const [apps, pats] = await Promise.all([
        getAppointments(user.uid),
        getPatients(user.uid)
      ]);
      setAppointments(apps);
      setPatients(pats);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const patient = patients.find(p => p.id === formData.patientId);
      await createAppointment(user.uid, {
        ...formData,
        patientName: patient?.name || 'Paciente'
      });
      toast.success('Consulta agendada com sucesso!');
      setShowForm(false);
      setFormData({ patientId: '', date: '', time: '', duration: 50, notes: '' });
      await loadData();
    } catch (error) {
      toast.error('Erro ao agendar: ' + error.message);
    }
  };

  const handleStatus = async (id, status) => {
    try {
      await updateAppointmentStatus(id, user.uid, status);
      toast.success(`Consulta ${status === 'done' ? 'realizada' : status === 'canceled' ? 'cancelada' : status}`);
      await loadData();
    } catch (error) {
      toast.error('Erro ao atualizar status: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta consulta?')) return;
    try {
      await deleteAppointment(id, user.uid);
      toast.success('Consulta excluída');
      await loadData();
    } catch (error) {
      toast.error('Erro ao excluir: ' + error.message);
    }
  };

  const filteredAppointments = filter === 'all'
    ? appointments
    : appointments.filter(a => a.status === filter);

  const statusLabels = {
    scheduled: { label: 'Agendada', color: '#F59E0B', bg: '#FFFBEB' },
    confirmed: { label: 'Confirmada', color: '#4F46E5', bg: '#EEF2FF' },
    done: { label: 'Realizada', color: '#10B981', bg: '#ECFDF5' },
    canceled: { label: 'Cancelada', color: '#EF4444', bg: '#FEF2F2' },
    missed: { label: 'Faltou', color: '#6B7280', bg: '#F3F4F6' }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Carregando agenda...</div>;
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>📅 Agenda</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
            {appointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length} consultas agendadas
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'var(--primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontWeight: 500,
            transition: 'var(--transition)'
          }}
        >
          <Plus size={18} /> Nova Consulta
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['all', 'scheduled', 'confirmed', 'done', 'canceled', 'missed'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              padding: '0.3rem 0.8rem',
              borderRadius: '20px',
              border: filter === status ? '2px solid var(--primary)' : '1px solid var(--border-color)',
              background: filter === status ? 'var(--primary-light)' : 'transparent',
              color: filter === status ? 'var(--primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: filter === status ? 600 : 400,
              transition: 'var(--transition)'
            }}
          >
            {status === 'all' ? 'Todas' : statusLabels[status]?.label || status}
          </button>
        ))}
      </div>

      {/* Formulário */}
      {showForm && (
        <div style={{
          background: 'var(--bg-primary)',
          padding: '1.5rem',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border-color)',
          marginBottom: '1.5rem',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Nova Consulta</h3>
            <button
              onClick={() => setShowForm(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <select
              value={formData.patientId}
              onChange={e => setFormData({ ...formData, patientId: e.target.value })}
              required
              style={{
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                gridColumn: '1 / -1'
              }}
            >
              <option value="">Selecione um paciente</option>
              {patients.filter(p => p.status === 'active').map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <input
              type="date"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              required
              style={{
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            />
            <input
              type="time"
              value={formData.time}
              onChange={e => setFormData({ ...formData, time: e.target.value })}
              required
              style={{
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            />
            <input
              type="number"
              placeholder="Duração (min)"
              value={formData.duration}
              onChange={e => setFormData({ ...formData, duration: Number(e.target.value) })}
              style={{
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            />
            <textarea
              placeholder="Observações"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              rows="2"
              style={{
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                gridColumn: '1 / -1'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '0.6rem',
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontWeight: 500,
                gridColumn: '1 / -1'
              }}
            >
              Agendar
            </button>
          </form>
        </div>
      )}

      {/* Lista de consultas */}
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {filteredAppointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Nenhuma consulta encontrada
          </div>
        ) : (
          filteredAppointments.map(a => {
            const statusInfo = statusLabels[a.status] || statusLabels.scheduled;
            return (
              <div
                key={a.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.8rem 1rem',
                  background: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  transition: 'var(--transition)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.patientName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CalendarIcon size={14} />
                      {a.date?.toDate().toLocaleDateString('pt-BR')}
                      <ClockIcon size={14} />
                      {a.time} ({a.duration || 50} min)
                    </div>
                  </div>
                  <span style={{
                    padding: '0.15rem 0.6rem',
                    borderRadius: '12px',
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    background: statusInfo.bg,
                    color: statusInfo.color
                  }}>
                    {statusInfo.label}
                  </span>
                  {a.notes && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      {a.notes}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  {(a.status === 'scheduled' || a.status === 'confirmed') && (
                    <>
                      <button
                        onClick={() => handleStatus(a.id, 'done')}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#10B981',
                          padding: '0.2rem 0.4rem',
                          fontSize: '0.8rem'
                        }}
                        title="Marcar como realizada"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => handleStatus(a.id, 'canceled')}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#EF4444',
                          padding: '0.2rem 0.4rem',
                          fontSize: '0.8rem'
                        }}
                        title="Cancelar"
                      >
                        <X size={16} />
                      </button>
                    </>
                  )}
                  {(a.status === 'canceled' || a.status === 'missed') && (
                    <button
                      onClick={() => handleStatus(a.id, 'scheduled')}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#F59E0B',
                        padding: '0.2rem 0.4rem',
                        fontSize: '0.8rem'
                      }}
                      title="Reagendar"
                    >
                      🔄
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(a.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      padding: '0.2rem 0.4rem',
                      fontSize: '0.8rem'
                    }}
                    title="Excluir"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
