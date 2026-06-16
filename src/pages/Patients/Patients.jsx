import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getPatients } from '../../services/patientService';
import { Link } from 'react-router-dom';

export default function Patients() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const list = await getPatients(user.uid);
      setPatients(list);
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) return <div>Carregando...</div>;

  return (
    <div style={{ padding: '1rem' }}>
      <h1>Pacientes</h1>
      <Link
        to="/patients/new"
        style={{
          display: 'inline-block',
          marginBottom: '1rem',
          background: '#4F46E5',
          color: '#fff',
          padding: '0.5rem 1rem',
          borderRadius: '6px',
          textDecoration: 'none'
        }}
      >
        + Novo Paciente
      </Link>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {patients.map(p => (
          <li key={p.id} style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
            <Link to={`/patients/${p.id}`} style={{ textDecoration: 'none', color: '#0f172a' }}>
              {p.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
