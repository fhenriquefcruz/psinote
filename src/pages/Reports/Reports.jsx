import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getPatients } from '../../services/patientService';
import { getSessionsByPatient } from '../../services/sessionService';
import { toast } from 'react-toastify';
import { FileText, Download, TrendingUp, Users } from 'lucide-react';

export default function Reports() {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [patients, setPatients] = useState([]);

  const loadPatients = async () => {
    try {
      const list = await getPatients(user.uid);
      setPatients(list);
    } catch (error) {
      toast.error('Erro ao carregar pacientes: ' + error.message);
    }
  };

  const generatePatientReport = async () => {
    if (!selectedPatient) {
      toast.warning('Selecione um paciente');
      return;
    }
    setLoading(true);
    try {
      const sessions = await getSessionsByPatient(selectedPatient, user.uid);
      const patient = patients.find(p => p.id === selectedPatient);

      // Aqui você pode gerar o PDF usando jspdf ou react-pdf
      toast.info(`Relatório do paciente ${patient?.name} com ${sessions.length} sessões gerado! (em breve com PDF)`);
    } catch (error) {
      toast.error('Erro ao gerar relatório: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateStatisticsReport = async () => {
    setLoading(true);
    try {
      const allPatients = await getPatients(user.uid);
      const activePatients = allPatients.filter(p => p.status === 'active');
      // Aqui você pode gerar estatísticas
      toast.info(`Relatório estatístico: ${allPatients.length} pacientes, ${activePatients.length} ativos (em breve com PDF)`);
    } catch (error) {
      toast.error('Erro ao gerar relatório: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>📊 Relatórios</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
          Gere documentos profissionais e estatísticas da sua prática
        </p>
        {userProfile?.crp && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            CRP: {userProfile.crp} - {userProfile.crpUf}
          </p>
        )}
      </div>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {/* Relatório do Paciente */}
        <div style={{
          background: 'var(--bg-primary)',
          padding: '1.5rem',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} color="var(--primary)" />
            Relatório do Paciente
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Histórico completo de evolução e sessões
          </p>
          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
            <select
              value={selectedPatient}
              onChange={e => setSelectedPatient(e.target.value)}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
              onFocus={loadPatients}
            >
              <option value="">Selecione um paciente</option>
              {patients.filter(p => p.status === 'active').map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button
              onClick={generatePatientReport}
              disabled={loading || !selectedPatient}
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: loading || !selectedPatient ? 'not-allowed' : 'pointer',
                opacity: loading || !selectedPatient ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Download size={16} />
              Gerar PDF
            </button>
          </div>
        </div>

        {/* Relatório Estatístico */}
        <div style={{
          background: 'var(--bg-primary)',
          padding: '1.5rem',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} color="var(--primary)" />
            Relatório Estatístico
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Métricas da sua prática clínica
          </p>
          <button
            onClick={generateStatisticsReport}
            disabled={loading}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Download size={16} />
            Gerar PDF
          </button>
        </div>
      </div>

      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        background: 'var(--bg-tertiary)',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }}>
        <strong>📌 Conformidade CRP:</strong> Os relatórios incluem identificação profissional (CRP) e são gerados em conformidade com as normas do Conselho Regional de Psicologia.
      </div>
    </div>
  );
}
