import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { createPatient, updatePatient, getPatientById } from '../../services/patientService';
import { toast } from 'react-toastify';
import Tooltip from '../../components/common/Tooltip/Tooltip';

export default function PatientForm() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    email: '',
    cpf: '',
    birthDate: '',
    gender: '',
    maritalStatus: '',
    profession: '',
    address: '',
    emergencyContact: '',
    observations: '',
    anamnesis: {
      chiefComplaint: '',
      familyHistory: '',
      medicalHistory: '',
      medications: '',
      therapeuticGoals: '',
      initialObservations: ''
    }
  });

  useEffect(() => {
    if (id) {
      const load = async () => {
        const data = await getPatientById(id);
        if (data) {
          setFormData({
            name: data.name || '',
            whatsapp: data.whatsapp || '',
            email: data.email || '',
            cpf: data.cpf || '',
            birthDate: data.birthDate || '',
            gender: data.gender || '',
            maritalStatus: data.maritalStatus || '',
            profession: data.profession || '',
            address: data.address || '',
            emergencyContact: data.emergencyContact || '',
            observations: data.observations || '',
            anamnesis: data.anamnesis || {
              chiefComplaint: '',
              familyHistory: '',
              medicalHistory: '',
              medications: '',
              therapeuticGoals: '',
              initialObservations: ''
            }
          });
        }
      };
      load();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('anamnesis.')) {
      const key = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        anamnesis: { ...prev.anamnesis, [key]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validações básicas
    if (!formData.name.trim()) return toast.error('Nome é obrigatório');
    if (!formData.whatsapp.trim()) return toast.error('WhatsApp é obrigatório');
    if (!formData.birthDate) return toast.error('Data de nascimento é obrigatória');

    setLoading(true);
    try {
      if (id) {
        await updatePatient(id, user.uid, formData);
        toast.success('Paciente atualizado com sucesso!');
      } else {
        await createPatient(user.uid, formData);
        toast.success('Paciente cadastrado com sucesso!');
      }
      navigate('/patients');
    } catch (error) {
      toast.error('Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.5rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    transition: 'var(--transition)'
  };

  const labelStyle = {
    fontSize: '0.8rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    display: 'block',
    marginBottom: '0.3rem'
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1.5rem' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>{id ? 'Editar Paciente' : 'Novo Paciente'}</h1>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Nome - obrigatório */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Nome completo <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input name="name" value={formData.name} onChange={handleChange} required style={inputStyle} />
        </div>

        {/* WhatsApp - obrigatório */}
        <div>
          <label style={labelStyle}>WhatsApp <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="(00) 00000-0000" required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Email</label>
          <input name="email" type="email" value={formData.email} onChange={handleChange} style={inputStyle} />
        </div>

        {/* CPF - validação simples */}
        <div>
          <label style={labelStyle}>CPF (opcional)</label>
          <input name="cpf" value={formData.cpf} onChange={handleChange} placeholder="000.000.000-00" maxLength="14" style={inputStyle}
            onInput={(e) => e.target.value = e.target.value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')} />
        </div>
        <div>
          <label style={labelStyle}>Data de nascimento <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input name="birthDate" type="date" value={formData.birthDate} onChange={handleChange} required style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Gênero</label>
          <select name="gender" value={formData.gender} onChange={handleChange} style={inputStyle}>
            <option value="">Selecione</option>
            <option value="masculino">Masculino</option>
            <option value="feminino">Feminino</option>
            <option value="outro">Outro</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Estado civil</label>
          <input name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Profissão</label>
          <input name="profession" value={formData.profession} onChange={handleChange} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Contato de emergência</label>
          <input name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} style={inputStyle} />
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Endereço</label>
          <textarea name="address" value={formData.address} onChange={handleChange} rows="2" style={inputStyle} />
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Observações</label>
          <textarea name="observations" value={formData.observations} onChange={handleChange} rows="3" style={inputStyle} />
        </div>

        {/* Anamnese */}
        <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <h3 style={{ margin: '0 0 1rem 0' }}>Anamnese</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Queixa principal <Tooltip text="Descreva o motivo principal que trouxe o paciente à terapia" /></label>
              <textarea name="anamnesis.chiefComplaint" value={formData.anamnesis.chiefComplaint} onChange={handleChange} rows="2" style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Histórico familiar</label>
              <textarea name="anamnesis.familyHistory" value={formData.anamnesis.familyHistory} onChange={handleChange} rows="2" style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Histórico médico</label>
              <textarea name="anamnesis.medicalHistory" value={formData.anamnesis.medicalHistory} onChange={handleChange} rows="2" style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Uso de medicamentos</label>
              <input name="anamnesis.medications" value={formData.anamnesis.medications} onChange={handleChange} style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Objetivos terapêuticos</label>
              <textarea name="anamnesis.therapeuticGoals" value={formData.anamnesis.therapeuticGoals} onChange={handleChange} rows="2" style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Observações iniciais</label>
              <textarea name="anamnesis.initialObservations" value={formData.anamnesis.initialObservations} onChange={handleChange} rows="2" style={inputStyle} />
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} style={{ gridColumn: '1 / -1', padding: '0.7rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '1rem', opacity: loading ? 0.7 : 1, transition: 'var(--transition)' }}>
          {loading ? 'Salvando...' : (id ? 'Atualizar' : 'Cadastrar')}
        </button>
      </form>
    </div>
  );
}
