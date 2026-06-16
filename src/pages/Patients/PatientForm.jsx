import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { createPatient } from '../../services/patientService';
import { toast } from 'react-toastify';

export default function PatientForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    birthDate: '',
    gender: '',
    observations: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createPatient(user.uid, formData);
      toast.success('Paciente cadastrado com sucesso!');
      navigate('/patients');
    } catch (error) {
      toast.error('Erro ao cadastrar paciente: ' + error.message);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
      <h1>Novo Paciente</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input
          type="text"
          name="name"
          placeholder="Nome completo"
          value={formData.name}
          onChange={handleChange}
          required
          style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
        />
        <input
          type="tel"
          name="phone"
          placeholder="Telefone"
          value={formData.phone}
          onChange={handleChange}
          style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
        />
        <input
          type="email"
          name="email"
          placeholder="E-mail"
          value={formData.email}
          onChange={handleChange}
          style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
        />
        <input
          type="date"
          name="birthDate"
          value={formData.birthDate}
          onChange={handleChange}
          style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
        />
        <select
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
        >
          <option value="">Gênero</option>
          <option value="masculino">Masculino</option>
          <option value="feminino">Feminino</option>
          <option value="outro">Outro</option>
        </select>
        <textarea
          name="observations"
          placeholder="Observações"
          value={formData.observations}
          onChange={handleChange}
          rows="4"
          style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
        />
        <button
          type="submit"
          style={{ padding: '0.6rem', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        >
          Cadastrar
        </button>
      </form>
    </div>
  );
}
