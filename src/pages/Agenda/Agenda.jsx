import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getAppointments, createAppointment, updateAppointmentStatus, deleteAppointment, rescheduleAppointment } from '../../services/appointmentService';
import { getPatients } from '../../services/patientService';
import { toast } from 'react-toastify';
import { Plus, X, Check, Calendar as CalendarIcon, Clock as ClockIcon, Search } from 'lucide-react';
import { parseDate } from '../../utils/helpers';

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
  const [patientFilter, setPatientFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [rescheduleData, setRescheduleData] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({ date: '', time: '' });

  const loadData = async () => {
    try {
      const [apps, pats] = await Promise.all([
        getAppointments(user.uid),
        getPatients(user.uid)
      ]);
      setAppointments(apps);
      setPatients(pats);
      setFilteredPatients(pats.filter(p => p.status === 'active'));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const filtered = patients.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        p.status === 'active'
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients.filter(p => p.status === 'active'));
    }
  }, [searchTerm, patients]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.date || !formData.time) {
      toast.warning('Preencha todos os campos obrigatórios');
      return;
    }
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
    let cancelReason = '';
    if (status === 'canceled') {
      cancelReason = prompt('Motivo do cancelamento:');
      if (cancelReason === null) return;
      if (!cancelReason.trim()) {
        toast.warning('É obrigatório informar o motivo do cancelamento');
        return;
      }
    }
    try {
      await updateAppointmentStatus(id, user.uid, status, cancelReason);
      toast.success(`Consulta ${status === 'done' ? 'realizada' : status === 'canceled' ? 'cancelada' : status}`);
      await loadData();
    } catch (error) {
      toast.error('Erro ao atualizar status: ' + error.message);
    }
  };

  const handleReschedule = (appointment) => {
    const dateObj = parseDate(appointment.date);
    setRescheduleData(appointment);
    setRescheduleForm({
      date: dateObj ? dateObj.toISOString().slice(0,10) : '',
      time: appointment.time || ''
    });
  };

  const confirmReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleForm.date || !rescheduleForm.time) {
      toast.warning('Preencha a nova data e hora');
      return;
    }
    try {
      await rescheduleAppointment(rescheduleData.id, user.uid, rescheduleForm.date, rescheduleForm.time);
      toast.success('Consulta reagendada com sucesso!');
      setRescheduleData(null);
      await loadData();
    } catch (error) {
      toast.error('Erro ao reagendar: ' + error.message);
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

  const filteredAppointments = appointments.filter(a => {
    if (filter !== 'all' && a.status !== filter) return false;
    if (patientFilter && a.patientId !== patientFilter) return false;
    return true;
  });

  const getPatientStats = (patientId) => {
    const patientAppointments = appointments.filter(a => a.patientId === patientId);
    const done = patientAppointments.filter(a => a.status === 'done').length;
    const canceled = patientAppointments.filter(a => a.status === 'canceled').length;
    const missed = patientAppointments.filter(a => a.status === 'missed').length;
    return { done, canceled, missed };
  };

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>📅 Agenda</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
            {appointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length} consultas agendadas
          </p>
        </div>
        <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 500, transition: 'var(--transition)' }}>
          <Plus size={18} /> Nova Consulta
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', marginBottom: '1.5rem', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Nova Consulta</h3>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
          </div>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Paciente *</label>
              <div style={{ position: 'relative' }}>
                <input type="text" placeholder="Digite o nome do paciente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                <Search size={16} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                {searchTerm.length >= 2 && filteredPatients.length > 0 && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', maxHeight: '200px', overflowY: 'auto', zIndex: 10, boxShadow: 'var(--shadow-md)' }}>
                    {filteredPatients.map(p => (
                      <div key={p.id} onClick={() => { setFormData({ ...formData, patientId: p.id }); setSearchTerm(p.name); setFilteredPatients([]); }} style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', transition: 'var(--transition)' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                        {p.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
            <input type="time" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} required style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Duração (min)</label>
              <input type="number" value={formData.duration} onChange={e => setFormData({ ...formData, duration: Number(e.target.value) })} style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
            </div>
            <textarea placeholder="Observações" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows="2" style={{ gridColumn: '1 / -1', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
            <button type="submit" style={{ gridColumn: '1 / -1', padding: '0.6rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 500 }}>Agendar</button>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {['all', 'scheduled', 'confirmed', 'done', 'canceled', 'missed'].map(status => (
          <button key={status} onClick={() => setFilter(status)} style={{ padding: '0.3rem 0.8rem', borderRadius: '20px', border: filter === status ? '2px solid var(--primary)' : '1px solid var(--border-color)', background: filter === status ? 'var(--primary-light)' : 'transparent', color: filter === status ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: filter === status ? 600 : 400 }}>
            {status === 'all' ? 'Todas' : statusLabels[status]?.label || status}
          </button>
        ))}
        <select value={patientFilter} onChange={e => setPatientFilter(e.target.value)} style={{ padding: '0.3rem 0.6rem', borderRadius: '20px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.75rem' }}>
          <option value="">Todos os pacientes</option>
          {patients.filter(p => p.status === 'active').map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {filteredAppointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Nenhuma consulta encontrada</div>
        ) : (
          filteredAppointments.map(a => {
            const statusInfo = statusLabels[a.status] || statusLabels.scheduled;
            const stats = getPatientStats(a.patientId);
            const dateObj = parseDate(a.date);
            return (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', transition: 'var(--transition)', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.patientName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <CalendarIcon size={14} /> {dateObj ? dateObj.toLocaleDateString('pt-BR') : 'Data inválida'}
                      <ClockIcon size={14} /> {a.time} ({a.duration || 50} min)
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        ✅ {stats.done} | ❌ {stats.canceled} | ⏳ {stats.missed}
                      </span>
                    </div>
                    {a.cancelReason && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>
                        Motivo: {a.cancelReason}
                      </div>
                    )}
                  </div>
                  <span style={{ padding: '0.15rem 0.6rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 500, background: statusInfo.bg, color: statusInfo.color }}>{statusInfo.label}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                  {(a.status === 'scheduled' || a.status === 'confirmed') && (
                    <>
                      <button onClick={() => handleStatus(a.id, 'done')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10B981', padding: '0.2rem 0.4rem' }} title="Realizada"><Check size={16} /></button>
                      <button onClick={() => handleStatus(a.id, 'canceled')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '0.2rem 0.4rem' }} title="Cancelar"><X size={16} /></button>
                      <button onClick={() => handleStatus(a.id, 'missed')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '0.2rem 0.4rem' }} title="Faltou">⏳</button>
                      <button onClick={() => handleReschedule(a)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F59E0B', padding: '0.2rem 0.4rem' }} title="Reagendar">🔄</button>
                    </>
                  )}
                  {(a.status === 'canceled' || a.status === 'missed') && (
                    <button onClick={() => handleReschedule(a)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F59E0B', padding: '0.2rem 0.4rem' }} title="Reagendar">🔄</button>
                  )}
                  <button onClick={() => handleDelete(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.2rem 0.4rem' }} title="Excluir">🗑️</button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {rescheduleData && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-primary)', padding: '2rem', borderRadius: 'var(--radius)', maxWidth: '400px', width: '100%', boxShadow: 'var(--shadow-xl)' }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Reagendar Consulta</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Paciente: <strong>{rescheduleData.patientName}</strong>
            </p>
            <form onSubmit={confirmReschedule} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <input type="date" value={rescheduleForm.date} onChange={e => setRescheduleForm({ ...rescheduleForm, date: e.target.value })} required style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
              <input type="time" value={rescheduleForm.time} onChange={e => setRescheduleForm({ ...rescheduleForm, time: e.target.value })} required style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" style={{ flex: 1, padding: '0.6rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 500 }}>Confirmar</button>
                <button type="button" onClick={() => setRescheduleData(null)} style={{ flex: 1, padding: '0.6rem', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
