import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getPatientById } from '../../services/patientService';
import { useAuth } from '../../hooks/useAuth';

export default function PatientProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPatientById(id);
        setPatient(data);
      } catch (error) {
        console.error('Erro ao carregar paciente:', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  if (loading) return <div>Carregando...</div>;
  if (!patient) return <div>Paciente não encontrado</div>;

  return (
    <div style={{ padding: '1rem' }}>
      <h1>{patient.name}</h1>
      <p><strong>Telefone:</strong> {patient.phone || 'Não informado'}</p>
      <p><strong>Email:</strong> {patient.email || 'Não informado'}</p>
      <p><strong>Status:</strong> {patient.status}</p>
    </div>
  );
}
