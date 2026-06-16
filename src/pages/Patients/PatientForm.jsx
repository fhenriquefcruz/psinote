import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { createPatient, updatePatient, getPatientById } from '../../services/patientService';
import { toast } from 'react-toastify';

export default function PatientForm() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
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
            phone: data.phone || '',
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

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '1rem' }}>
      <h1>{id ? 'Editar Paciente' : 'Novo Paciente'}</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        <input name="name" placeholder="Nome completo*" value={formData.name} onChange={handleChange} required style={inputStyle} />
        <input name="phone" placeholder="Telefone" value={formData.phone} onChange={handleChange} style={inputStyle} />
        <input name="whatsapp" placeholder="WhatsApp" value={formData.whatsapp} onChange={handleChange} style={inputStyle} />
        <input name="email" type="email" placeholder="E-mail" value={formData.email} onChange={handleChange} style={inputStyle} />
        <input name="cpf" placeholder="CPF (opcional)" value={formData.cpf} onChange={handleChange} style={inputStyle} />
        <input name="birthDate" type="date" value={formData.birthDate} onChange={handleChange} style={inputStyle} />
        <select name="gender" value={formData.gender} onChange={handleChange} style={inputStyle}>
          <option value="">Gênero</option>
          <option value="masculino">Masculino</option>
          <option value="feminino">Feminino</option>
          <option value="outro">Outro</option>
        </select>
        <input name="maritalStatus" placeholder="Estado civil" value={formData.maritalStatus} onChange={handleChange} style={inputStyle} />
        <input name="profession" placeholder="Profissão" value={formData.profession} onChange={handleChange} style={inputStyle} />
        <textarea name="address" placeholder="Endereço" value={formData.address} onChange={handleChange} rows="2" style={inputStyle} />
        <input name="emergencyContact" placeholder="Contato de emergência" value={formData.emergencyContact} onChange={handleChange} style={inputStyle} />
        <textarea name="observations" placeholder="Observações gerais" value={formData.observations} onChange={handleChange} rows="3" style={inputStyle} />

        <h3>Anamnese</h3>
        <textarea name="anamnesis.chiefComplaint" placeholder="Queixa principal" value={formData.anamnesis.chiefComplaint} onChange={handleChange} rows="2" style={inputStyle} />
        <textarea name="anamnesis.familyHistory" placeholder="Histórico familiar" value={formData.anamnesis.familyHistory} onChange={handleChange} rows="2" style={inputStyle} />
        <textarea name="anamnesis.medicalHistory" placeholder="Histórico médico" value={formData.anamnesis.medicalHistory} onChange={handleChange} rows="2" style={inputStyle} />
        <input name="anamnesis.medications" placeholder="Uso de medicamentos" value={formData.anamnesis.medications} onChange={handleChange} style={inputStyle} />
        <textarea name="anamnesis.therapeuticGoals" placeholder="Objetivos terapêuticos" value={formData.anamnesis.therapeuticGoals} onChange={handleChange} rows="2" style={inputStyle} />
        <textarea name="anamnesis.initialObservations" placeholder="Observações iniciais" value={formData.anamnesis.initialObservations} onChange={handleChange} rows="2" style={inputStyle} />

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? 'Salvando...' : (id ? 'Atualizar' : 'Cadastrar')}
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  padding: '0.5rem',
  borderRadius: '6px',
  border: '1px solid #e2e8f0',
  fontSize: '1rem',
  width: '100%',
  boxSizing: 'border-box'
};

const buttonStyle = {
  padding: '0.6rem',
  background: '#4F46E5',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '1rem'
};
