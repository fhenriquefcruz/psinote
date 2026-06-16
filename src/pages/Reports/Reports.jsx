import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getPatients, getPatientById } from '../../services/patientService';
import { getSessionsByPatient } from '../../services/sessionService';
import { toast } from 'react-toastify';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { FileText, Download } from 'lucide-react';

export default function Reports() {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [patients, setPatients] = useState([]);
  const [reportType, setReportType] = useState('patient');

  const loadPatients = async () => {
    const list = await getPatients(user.uid);
    setPatients(list);
  };

  const generatePatientPDF = async (patientId) => {
    const patient = await getPatientById(patientId);
    const sessions = await getSessionsByPatient(patientId, user.uid);

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;

    // Header
    doc.setFontSize(18);
    doc.setTextColor('#4F46E5');
    doc.text('PsiNote', 20, 25);

    doc.setFontSize(10);
    doc.setTextColor('#475569');
    doc.text(`Psicólogo(a): ${userProfile?.name || 'Não informado'}`, 20, 35);
    if (userProfile?.crp && userProfile?.crpUf) {
      doc.text(`CRP: ${userProfile.crp} - ${userProfile.crpUf}`, 20, 41);
    }
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 47);

    doc.line(20, 50, pageWidth - 20, 50);

    // Título
    doc.setFontSize(16);
    doc.setTextColor('#0f172a');
    doc.text(`Relatório do Paciente: ${patient.name}`, 20, 60);

    // Dados cadastrais
    doc.setFontSize(12);
    doc.setTextColor('#475569');
    let y = 70;
    doc.text(`📋 Dados Cadastrais`, 20, y);
    y += 8;
    doc.setFontSize(10);
    const fields = [
      ['Nome:', patient.name],
      ['WhatsApp:', patient.whatsapp || 'Não informado'],
      ['Email:', patient.email || 'Não informado'],
      ['Data Nasc.:', patient.birthDate || 'Não informado'],
      ['Gênero:', patient.gender || 'Não informado'],
      ['Profissão:', patient.profession || 'Não informado']
    ];
    fields.forEach(([label, value]) => {
      doc.text(`${label} ${value}`, 25, y);
      y += 6;
    });

    // Anamnese
    y += 4;
    doc.setFontSize(12);
    doc.text(`📋 Anamnese`, 20, y);
    y += 8;
    doc.setFontSize(10);
    const anamnesis = patient.anamnesis || {};
    const anamFields = [
      ['Queixa principal:', anamnesis.chiefComplaint || '-'],
      ['Histórico familiar:', anamnesis.familyHistory || '-'],
      ['Histórico médico:', anamnesis.medicalHistory || '-'],
      ['Medicamentos:', anamnesis.medications || '-'],
      ['Objetivos terapêuticos:', anamnesis.therapeuticGoals || '-'],
      ['Observações iniciais:', anamnesis.initialObservations || '-']
    ];
    anamFields.forEach(([label, value]) => {
      if (value.length > 50) {
        const lines = doc.splitTextToSize(value, 160);
        doc.text(`${label}`, 25, y);
        lines.forEach((line, i) => {
          doc.text(line, 25, y + 4 + i * 5);
        });
        y += lines.length * 5 + 4;
      } else {
        doc.text(`${label} ${value}`, 25, y);
        y += 6;
      }
    });

    // Sessões
    y += 8;
    if (sessions.length > 0) {
      doc.addPage();
      y = 20;
      doc.setFontSize(12);
      doc.text(`📋 Sessões Realizadas (${sessions.length})`, 20, y);
      y += 10;

      const tableData = sessions.map(s => [
        s.date?.toDate().toLocaleDateString('pt-BR') || '',
        s.mainTheme || '-',
        s.scales?.mood || '-'
      ]);

      doc.autoTable({
        startY: y,
        head: [['Data', 'Tema', 'Humor']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: '#4F46E5' }
      });
    } else {
      doc.text('Nenhuma sessão registrada.', 20, y + 4);
    }

    // Footer
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor('#94a3b8');
      doc.text(`Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} - Página ${i}/${totalPages}`, pageWidth - 50, 285);
    }

    // Download
    doc.save(`Relatorio_${patient.name}_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await loadPatients();
      if (reportType === 'patient' && !selectedPatient) {
        toast.warning('Selecione um paciente');
        return;
      }
      if (reportType === 'patient') {
        await generatePatientPDF(selectedPatient);
        toast.success('Relatório gerado com sucesso!');
      } else {
        // Estatístico - simplificado
        const allPatients = await getPatients(user.uid);
        const activePatients = allPatients.filter(p => p.status === 'active');
        toast.info(`Relatório estatístico: ${allPatients.length} pacientes, ${activePatients.length} ativos. Em breve mais detalhes.`);
      }
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
        <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>Gere documentos profissionais e estatísticas</p>
        {userProfile?.crp && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>CRP: {userProfile.crp} - {userProfile.crpUf}</p>
        )}
      </div>

      <div style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Tipo de Relatório</label>
            <select value={reportType} onChange={e => setReportType(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
              <option value="patient">Relatório do Paciente</option>
              <option value="statistics">Relatório Estatístico</option>
            </select>
          </div>

          {reportType === 'patient' && (
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Paciente</label>
              <select value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)} onFocus={loadPatients} style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                <option value="">Selecione um paciente</option>
                {patients.filter(p => p.status === 'active').map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <button onClick={handleGenerate} disabled={loading} style={{ padding: '0.7rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '1rem', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Download size={18} /> {loading ? 'Gerando...' : 'Gerar e Baixar PDF'}
          </button>
        </div>
      </div>

      <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <strong>📌 Conformidade CRP:</strong> Os relatórios incluem identificação profissional e são gerados em conformidade com as normas do Conselho Regional de Psicologia.
      </div>
    </div>
  );
}
