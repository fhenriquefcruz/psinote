// src/services/documentGeneratorService.js
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Função para desenhar a logo (linhas retas, compatível com jsPDF)
const drawLogo = (doc, x, y, size = 10) => {
  doc.setDrawColor('#4F46E5');
  doc.setLineWidth(1.5);
  // Zig-zag estilizado
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
  // Traço de caneta
  doc.moveTo(points[points.length-1][0], points[points.length-1][1]);
  doc.lineTo(x + size * 2.8, y + size * 1.2);
  doc.lineTo(x + size * 3.0, y + size);
  doc.stroke();
};

export const generateDocumentPDF = async ({ template, formData, userProfile, patient, docType }) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const margin = 20;
  let y = 20;

  // ===== CABEÇALHO =====
  // Se o psicólogo tiver uma logo personalizada, usar ela (em breve)
  // Por enquanto, usamos a logo do sistema
  drawLogo(doc, margin, y, 6);
  doc.setFontSize(22);
  doc.setTextColor('#4F46E5');
  doc.setFont('helvetica', 'bold');
  doc.text('PsiNote', margin + 28, y + 10);
  y += 18;

  // Linha separadora
  doc.setDrawColor('#E2E8F0');
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Dados do profissional
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

  // Título
  doc.setFontSize(16);
  doc.setTextColor('#0F172A');
  doc.setFont('helvetica', 'bold');
  doc.text(template.title, margin, y);
  y += 10;

  // ===== CONTEÚDO =====
  // Preencher os placeholders com os dados do formulário
  let content = template.baseText;
  const allData = { ...formData, crp: `${userProfile?.crp || ''} - ${userProfile?.crpUf || ''}` };
  Object.keys(allData).forEach(key => {
    content = content.replace(new RegExp(`\\{${key}\\}`, 'g'), allData[key] || `[${key}]`);
  });

  // Dividir o texto em linhas e adicionar ao PDF
  const lines = doc.splitTextToSize(content, pageWidth - margin * 2);
  doc.setFontSize(10);
  doc.setTextColor('#475569');
  doc.setFont('helvetica', 'normal');
  lines.forEach(line => {
    if (y > 270) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += 6;
  });

  // ===== RODAPÉ =====
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor('#94A3B8');
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Documento gerado em ${new Date().toLocaleDateString('pt-BR')} - Página ${i}/${totalPages}`,
      pageWidth - margin - 50,
      285
    );
    doc.setDrawColor('#E2E8F0');
    doc.setLineWidth(0.3);
    doc.line(margin, 280, pageWidth - margin, 280);
  }

  // Retornar o PDF como Blob
  return doc.output('blob');
};
