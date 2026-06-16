import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getPatientById } from '../../services/patientService';
import { useAuth } from '../../hooks/useAuth';

export default function PatientProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    const load = async () => {
      const data = await getPatientById(id);
      setPatient(data);
    };
    load();
  }, [id]);

  if (!patient) return <div>Carregando...</div>;
  return <div><h1>{patient.name}</h1><p>{patient.phone}</p></div>;
}
