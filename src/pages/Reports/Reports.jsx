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

  // ============================================
  // FUNÇÃO PARA DESENHAR A LOGO (SEM CURVAS)
  // Usando apenas linhas retas para garantir compatibilidade
  // ============================================
  const drawLogo = (doc, x, y, size = 10) => {
    doc.setDrawColor('#4F46E5');
    doc.setLineWidth(1.5);

    // Onda cerebral simplificada com segmentos de reta (zig-zag)
    // Pontos: (x, y+size) -> (x+size*0.6, y+size*0.2) -> (x+size*1.2, y+size*0.8) -> (x+size*1.8, y+size*0.2) -> (x+size*2.4, y+size)
    const points = [
      [x, y + size],
      [x + size * 0.6, y + size * 0.2],
      [x + size * 1.2, y + size * 0.8],
      [x + size * 1.8, y + size * 0.2],
      [x + size * 2.4, y + size],
    ];
    doc.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      doc.lineTo(points[i][0], points[i][1]);
    }
    doc.stroke();

    // Traço de caneta (linha reta) no final
    doc.moveTo(points[points.length-1][0], points[points.length-1][1]);
    doc.lineTo(x + size * 2.8, y + size * 1.2);
    doc.lineTo(x + size * 3.0, y + size);
    doc.stroke();
  };

  // ============================================
  // RELATÓRIO DO PACIENTE
  // ============================================
  const generatePatientPDF = async (patientId) => {
    const patient = await getPatientById(patientId);
    const sessions = await getSessionsByPatient(patientId, user.uid);

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const margin = 20;
    let y = 20;

    // ===== CABEÇALHO =====
    drawLogo(doc, margin, y, 6);
    doc.setFontSize(22);
    doc.setTextColor('#4F46E5');
    doc.setFont('helvetica', 'bold');
    doc.text('PsiNote', margin + 28, y + 10);

    y += 18;
    doc.setDrawColor('#E2E8F0');
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    doc.setFontSize(10);
    doc.setTextColor('#475569');
    doc.setFont('helvetica', 'normal');
    doc.text(`Psicólogo(a): ${userProfile?.name || 'Não informado'}`, margin, y);
    y += 6;
    if (userProfile?.crp && userProfile?.crpUf) {
      doc.text(`CRP: ${userProfile.crp} - ${userProfile.crpUf}`, margin, y);
      y += 6;
    }
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, margin, y);
    y += 10;

    // ===== TÍTULO =====
    doc.setFontSize(16);
    doc.setTextColor('#0F172A');
    doc.setFont('helvetica', 'bold');
    doc.text(`Relatório do Paciente: ${patient.name}`, margin, y);
    y += 10;

    // ===== DADOS CADASTRAIS =====
    doc.setFontSize(12);
    doc.setTextColor('#4F46E5');
    doc.setFont('helvetica', 'bold');
    doc.text('Dados Cadastrais', margin, y);
    y += 6;

    doc.setFontSize(10);
    doc.setTextColor('#475569');
    doc.setFont('helvetica', 'normal');
    const fields = [
      ['Nome:', patient.name],
      ['WhatsApp:', patient.whatsapp || 'Não informado'],
      ['Email:', patient.email || 'Não informado'],
      ['Data Nasc.:', patient.birthDate || 'Não informado'],
      ['Gênero:', patient.gender || 'Não informado'],
      ['Profissão:', patient.profession || 'Não informado']
    ];
    const col1 = fields.slice(0, 3);
    const col2 = fields.slice(3);
    const colX = margin + 80;
    col1.forEach(([label, value], i) => {
      doc.text(`${label} ${value}`, margin + 2, y + i * 6);
    });
    col2.forEach(([label, value], i) => {
      doc.text(`${label} ${value}`, colX, y + i * 6);
    });
    y += Math.max(col1.length, col2.length) * 6 + 4;

    // ===== ANAMNESE =====
    y += 4;
    doc.setFontSize(12);
    doc.setTextColor('#4F46E5');
    doc.setFont('helvetica', 'bold');
    doc.text('Anamnese', margin, y);
    y += 6;

    doc.setFontSize(10);
    doc.setTextColor('#475569');
    doc.setFont('helvetica', 'normal');
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
      const lines = doc.splitTextToSize(value, pageWidth - margin * 2 - 20);
      doc.text(`${label}`, margin + 2, y);
      y += 4;
      lines.forEach((line) => {
        doc.text(line, margin + 2, y);
        y += 5;
      });
      y += 2;
    });

    // ===== SESSÕES =====
    y += 6;
    doc.setFontSize(12);
    doc.setTextColor('#4F46E5');
    doc.setFont('helvetica', 'bold');
    doc.text(`Sessões Realizadas (${sessions.length})`, margin, y);
    y += 8;

    if (sessions.length > 0) {
      const tableData = sessions.map(s => {
        const date = s.date?.toDate ? s.date.toDate() : new Date(s.date);
        return [
          date.toLocaleDateString('pt-BR') || '',
          s.mainTheme || '-',
          s.scales?.mood !== undefined ? `${s.scales.mood}/10` : '-'
        ];
      });

      doc.autoTable({
        startY: y,
        head: [['Data', 'Tema', 'Humor']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2, halign: 'left' },
        headStyles: { fillColor: '#4F46E5', textColor: '#FFFFFF', fontSize: 9, halign: 'center' },
        margin: { left: margin, right: margin },
        alternateRowStyles: { fillColor: '#F8FAFC' },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 25, halign: 'center' }
        }
      });
      y = doc.lastAutoTable.finalY + 8;
    } else {
      doc.text('Nenhuma sessão registrada.', margin + 2, y);
      y += 8;
    }

    // ===== RODAPÉ =====
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor('#94A3B8');
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} - Página ${i}/${totalPages}`,
        pageWidth - margin - 50,
        285
      );
      doc.setDrawColor('#E2E8F0');
      doc.setLineWidth(0.3);
      doc.line(margin, 280, pageWidth - margin, 280);
    }

    doc.save(`Relatorio_${patient.name}_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  // ============================================
  // RELATÓRIO ESTATÍSTICO
  // ============================================
  const generateStatisticsPDF = async () => {
    const allPatients = await getPatients(user.uid);
    const activePatients = allPatients.filter(p => p.status === 'active');
    const archivedPatients = allPatients.filter(p => p.status === 'archived');
    const deletedPatients = allPatients.filter(p => p.status === 'deleted');

    let totalSessions = 0;
    for (const p of activePatients) {
      const sessions = await getSessionsByPatient(p.id, user.uid);
      totalSessions += sessions.length;
    }
    for (const p of archivedPatients) {
      const sessions = await getSessionsByPatient(p.id, user.uid);
      totalSessions += sessions.length;
    }

    const doc = new jsPDF('p', 'mm', 'a4');
    const margin = 20;
    let y = 20;
    const pageWidth = 210;

    drawLogo(doc, margin, y, 6);
    doc.setFontSize(22);
    doc.setTextColor('#4F46E5');
    doc.setFont('helvetica', 'bold');
    doc.text('PsiNote', margin + 28, y + 10);
    y += 18;
    doc.setDrawColor('#E2E8F0');
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    doc.setFontSize(10);
    doc.setTextColor('#475569');
    doc.setFont('helvetica', 'normal');
    doc.text(`Psicólogo(a): ${userProfile?.name || 'Não informado'}`, margin, y);
    y += 6;
    if (userProfile?.crp && userProfile?.crpUf) {
      doc.text(`CRP: ${userProfile.crp} - ${userProfile.crpUf}`, margin, y);
      y += 6;
    }
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, margin, y);
    y += 10;

    doc.setFontSize(16);
    doc.setTextColor('#0F172A');
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório Estatístico', margin, y);
    y += 10;

    doc.setFontSize(11);
    doc.setTextColor('#475569');
    doc.setFont('helvetica', 'normal');

    const stats = [
      ['Total de pacientes cadastrados', allPatients.length],
      ['Pacientes ativos', activePatients.length],
      ['Pacientes arquivados', archivedPatients.length],
      ['Pacientes na lixeira', deletedPatients.length],
      ['Total de sessões realizadas', totalSessions]
    ];

    doc.autoTable({
      startY: y,
      head: [['Métrica', 'Valor']],
      body: stats,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: '#4F46E5', textColor: '#FFFFFF' },
      margin: { left: margin, right: margin },
      alternateRowStyles: { fillColor: '#F8FAFC' }
    });
    y = doc.lastAutoTable.finalY + 10;

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor('#94A3B8');
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} - Página ${i}/${totalPages}`,
        pageWidth - margin - 50,
        285
      );
      doc.setDrawColor('#E2E8F0');
      doc.setLineWidth(0.3);
      doc.line(margin, 280, pageWidth - margin, 280);
    }

    doc.save(`Relatorio_Estatistico_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  // ============================================
  // HANDLE GENERATE
  // ============================================
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
        toast.success('Relatório do paciente gerado!');
      } else {
        await generateStatisticsPDF();
        toast.success('Relatório estatístico gerado!');
      }
    } catch (error) {
      toast.error('Erro ao gerar relatório: ' + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div style={{ padding: '1.5rem', maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>📊 Relatórios</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
          Gere documentos profissionais e estatísticas
        </p>
        {userProfile?.crp && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            CRP: {userProfile.crp} - {userProfile.crpUf}
          </p>
        )}
      </div>

      <div style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
              Tipo de Relatório
            </label>
            <select
              value={reportType}
              onChange={e => setReportType(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="patient">Relatório do Paciente</option>
              <option value="statistics">Relatório Estatístico</option>
            </select>
          </div>

          {reportType === 'patient' && (
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                Paciente
              </label>
              <select
                value={selectedPatient}
                onChange={e => setSelectedPatient(e.target.value)}
                onFocus={loadPatients}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="">Selecione um paciente</option>
                {patients.filter(p => p.status === 'active').map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              padding: '0.7rem',
              background: 'var(--primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '1rem',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'var(--transition)'
            }}
          >
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
