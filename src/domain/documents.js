export const DOCUMENT_KINDS = {
  ATTACHMENT: 'attachment',
  GENERATED: 'generated'
};

export const DOCUMENT_STATUSES = {
  STORED: 'stored',
  ISSUED: 'issued',
  ARCHIVED: 'archived'
};

export const documentVersionId = (documentId, version) =>
  documentId + '_v' + version;

export const safeDocumentFileName = (label, patientName, issueDate) => {
  const raw = [label, patientName || 'documento', issueDate || '']
    .filter(Boolean)
    .join('_');

  return (
    raw
      .normalize('NFKD')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 120)
    + '.pdf'
  );
};
