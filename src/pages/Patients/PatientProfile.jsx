import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getPatientById, archivePatient, restorePatient } from '../../services/patientService';
import { getSessionsByPatient } from '../../services/sessionService';
import { getDocuments } from '../../services/documentService';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';

export default function PatientProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [activeTab, setActiveTab] = useState('resumo');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const p = await getPatientById(id);
        setPatient(p);
        const s = await getSessionsByPatient(id, user.uid);
        setSessions(s);
        const d = await getDocuments(user.uid, id);
        setDocuments(d);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id, user]);

  const handleArchive = async () => {
    await archivePatient(id, user.uid);
    toast.success('Paciente arquivado');
    setPatient(prev => ({ ...prev, status: 'archived' }));
  };

  const handleRestore = async () => {
    await restorePatient(id, user.uid);
    toast.success('Paciente restaurado');
    setPatient(prev => ({ ...prev, status: 'active' }));
  };

  if (loading) return <div>Carregando...</div>;
  if (!patient) return <div>Paciente não encontrado</div>;

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>{patient.name}</h1>
        <div>
          {patient.status === 'active' && (
            <>
              <Link to={`/patients/edit/${id}`} style={buttonStyle}>Editar</Link>
              <button onClick={handleArchive} style={buttonStyle}>Arquivar</button>
            </>
          )}
          {patient.status === 'archived' && (
            <button onClick={handleRestore} style={buttonStyle}>Restaurar</button>
          )}
        </div>
      </div>
      <p><strong>Telefone:</strong> {patient.phone || 'Não informado'}</p>
      <p><strong>Email:</strong> {patient.email || 'Não informado'}</p>
      <p><strong>Status:</strong> {patient.status}</p>

      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
        <button onClick={() => setActiveTab('resumo')} style={tabStyle(activeTab === 'resumo')}>Resumo</button>
        <button onClick={() => setActiveTab('sessoes')} style={tabStyle(activeTab === 'sessoes')}>Sessões ({sessions.length})</button>
        <button onClick={() => setActiveTab('documentos')} style={tabStyle(activeTab === 'documentos')}>Documentos ({documents.length})</button>
      </div>

      <div style={{ marginTop: '1rem' }}>
        {activeTab === 'resumo' && (
          <div>
            <h3>Dados cadastrais</h3>
            <p><strong>CPF:</strong> {patient.cpf || '-'}</p>
            <p><strong>Data nasc.:</strong> {patient.birthDate || '-'}</p>
            <p><strong>Gênero:</strong> {patient.gender || '-'}</p>
            <p><strong>Estado civil:</strong> {patient.maritalStatus || '-'}</p>
            <p><strong>Profissão:</strong> {patient.profession || '-'}</p>
            <p><strong>Endereço:</strong> {patient.address || '-'}</p>
            <p><strong>Contato emergência:</strong> {patient.emergencyContact || '-'}</p>
            <h3>Anamnese</h3>
            <p><strong>Queixa principal:</strong> {patient.anamnesis?.chiefComplaint || '-'}</p>
            <p><strong>Histórico familiar:</strong> {patient.anamnesis?.familyHistory || '-'}</p>
            <p><strong>Histórico médico:</strong> {patient.anamnesis?.medicalHistory || '-'}</p>
            <p><strong>Medicamentos:</strong> {patient.anamnesis?.medications || '-'}</p>
            <p><strong>Objetivos terapêuticos:</strong> {patient.anamnesis?.therapeuticGoals || '-'}</p>
            <p><strong>Observações:</strong> {patient.anamnesis?.initialObservations || '-'}</p>
          </div>
        )}

        {activeTab === 'sessoes' && (
          <div>
            {sessions.length === 0 ? (
              <p>Nenhuma sessão registrada.</p>
            ) : (
              <ul>
                {sessions.map(s => (
                  <li key={s.id}>{s.date?.toDate().toLocaleDateString()} - {s.mainTheme || 'Sem tema'}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'documentos' && (
          <div>
            {documents.length === 0 ? (
              <p>Nenhum documento.</p>
            ) : (
              <ul>
                {documents.map(d => (
                  <li key={d.id}>
                    <a href={d.fileURL} target="_blank" rel="noopener noreferrer">{d.name}</a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const buttonStyle = {
  padding: '0.4rem 1rem',
  marginLeft: '0.5rem',
  background: '#4F46E5',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  textDecoration: 'none'
};

const tabStyle = (active) => ({
  padding: '0.5rem 1rem',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontWeight: active ? 'bold' : 'normal',
  borderBottom: active ? '2px solid #4F46E5' : 'none'
});
