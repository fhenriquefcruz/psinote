import { jsPDF } from 'jspdf';

const PAGE = {
  width: 210,
  height: 297,
  marginX: 22,
  marginTop: 22,
  marginBottom: 24
};

const bodyWidth = PAGE.width - PAGE.marginX * 2;

const ensureSpace = (doc, state, requiredHeight) => {
  if (state.y + requiredHeight <= PAGE.height - PAGE.marginBottom) return;

  doc.addPage();
  state.y = PAGE.marginTop;
};

const addWrappedText = (
  doc,
  state,
  text,
  {
    fontSize = 10.5,
    fontStyle = 'normal',
    color = '#27352F',
    lineHeight = 5.4,
    spacingAfter = 2.5
  } = {}
) => {
  const value = String(text || '').trim();
  if (!value) return;

  doc.setFont('helvetica', fontStyle);
  doc.setFontSize(fontSize);
  doc.setTextColor(color);

  const lines = doc.splitTextToSize(value, bodyWidth);

  for (const line of lines) {
    ensureSpace(doc, state, lineHeight + 1);
    doc.text(line, PAGE.marginX, state.y);
    state.y += lineHeight;
  }

  state.y += spacingAfter;
};

const addHeading = (doc, state, text) => {
  ensureSpace(doc, state, 12);
  state.y += 2;
  addWrappedText(doc, state, text, {
    fontSize: 10.5,
    fontStyle: 'bold',
    color: '#17211D',
    lineHeight: 5.3,
    spacingAfter: 2.5
  });
};

const addIdentification = (doc, state, rows) => {
  for (const [label, value] of rows || []) {
    if (!value) continue;
    addWrappedText(doc, state, label + ': ' + value, {
      fontSize: 9.7,
      lineHeight: 5,
      spacingAfter: 0.8
    });
  }

  if (rows?.length) state.y += 3;
};

const drawHeader = (doc, state, model) => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor('#567066');
  doc.text('PsiNote', PAGE.marginX, state.y);

  doc.setDrawColor('#C8D6D0');
  doc.setLineWidth(0.35);
  doc.line(
    PAGE.marginX,
    state.y + 4,
    PAGE.width - PAGE.marginX,
    state.y + 4
  );

  state.y += 15;

  addWrappedText(doc, state, model.title, {
    fontSize: 15,
    fontStyle: 'bold',
    color: '#17211D',
    lineHeight: 7,
    spacingAfter: 6
  });

  if (model.subtitle) {
    addWrappedText(doc, state, model.subtitle, {
      fontSize: 10,
      color: '#567066',
      lineHeight: 5,
      spacingAfter: 4
    });
  }
};

const drawClosing = (doc, state, closing) => {
  ensureSpace(doc, state, 42);
  state.y += 8;

  addWrappedText(
    doc,
    state,
    [closing?.place, closing?.issueDate].filter(Boolean).join(', '),
    {
      fontSize: 10,
      lineHeight: 5,
      spacingAfter: 13
    }
  );

  const professionalName =
    closing?.professional?.name || 'Profissional não informado';
  const registration =
    closing?.professional?.registration || 'Registro não informado';

  doc.setDrawColor('#93A69E');
  doc.line(PAGE.marginX, state.y, PAGE.marginX + 75, state.y);
  state.y += 5;

  addWrappedText(doc, state, professionalName, {
    fontSize: 9.5,
    fontStyle: 'bold',
    lineHeight: 4.8,
    spacingAfter: 0
  });

  addWrappedText(doc, state, registration, {
    fontSize: 9,
    color: '#567066',
    lineHeight: 4.6,
    spacingAfter: 0
  });
};

const drawFooters = (doc, template) => {
  const pageCount = doc.internal.getNumberOfPages();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);

    doc.setDrawColor('#D7E2DD');
    doc.setLineWidth(0.25);
    doc.line(
      PAGE.marginX,
      PAGE.height - 17,
      PAGE.width - PAGE.marginX,
      PAGE.height - 17
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.4);
    doc.setTextColor('#758A81');

    const templateLabel = template
      ? template.id + ' • v' + template.version
      : 'documento';

    doc.text(
      templateLabel,
      PAGE.marginX,
      PAGE.height - 11
    );

    doc.text(
      'Página ' + page + ' de ' + pageCount,
      PAGE.width - PAGE.marginX,
      PAGE.height - 11,
      { align: 'right' }
    );
  }
};

export const generateDocumentPDF = async ({
  model,
  template
}) => {
  if (!model?.title) {
    throw new Error('Modelo renderizado inválido.');
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const state = { y: PAGE.marginTop };

  drawHeader(doc, state, model);
  addIdentification(doc, state, model.identification);

  for (const section of model.sections || []) {
    if (section.heading) addHeading(doc, state, section.heading);

    for (const paragraph of section.paragraphs || []) {
      addWrappedText(doc, state, paragraph);
    }
  }

  drawClosing(doc, state, model.closing);
  drawFooters(doc, template);

  return doc.output('blob');
};
