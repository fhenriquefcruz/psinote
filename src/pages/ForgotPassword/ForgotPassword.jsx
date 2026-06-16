import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getPatients } from '../../services/patientService';
import { Link } from 'react-router-dom';
import styles from './Patients.module.css';

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
    <div className={styles.container}>
      <h1>Pacientes</h1>
      <Link to="/patients/new" className={styles.btnNew}>+ Novo Paciente</Link>
      <ul className={styles.list}>
        {patients.map(p => (
          <li key={p.id}>
            <Link to={`/patients/${p.id}`}>{p.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
