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
    <div>
      <h1>{patient.name}</h1>
      <p>Telefone: {patient.phone || 'Não informado'}</p>
      <p>Email: {patient.email || 'Não informado'}</p>
      {/* Adicione mais campos conforme necessário */}
    </div>
  );
}
