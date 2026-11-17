// Clinical files must be served through owner-scoped Firebase Storage.
// Legacy public URLs are deliberately never accepted as fallback access.
export const isPrivateDocumentReference = (documentData, psychologistId) => {
  if (!documentData || typeof psychologistId !== 'string' || !psychologistId) {
    return false;
  }
  const path = documentData.storagePath;
  const prefix = 'users/' + psychologistId + '/documents/';
  if (documentData.psychologistId !== psychologistId
    || documentData.storageProvider !== 'firebase'
    || typeof path !== 'string'
    || !path.startsWith(prefix)) {
    return false;
  }
  const parts = path.split('/');
  return parts.length >= 5
    && parts.every((part) => part.length > 0 && part !== '.' && part !== '..');
};

const EXTENSION_BY_MIME = Object.freeze({
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
});

// A new object key never embeds a patientId or the original filename.
export const buildPrivateStoragePath = (psychologistId, mimeType, opaqueId) => {
  if (typeof psychologistId !== 'string' || !psychologistId
    || psychologistId.includes('/') || !EXTENSION_BY_MIME[mimeType]
    || typeof opaqueId !== 'string' || !/^[a-zA-Z0-9-]{10,80}$/.test(opaqueId)) {
    throw new Error('Referência privada de arquivo inválida.');
  }
  return 'users/' + psychologistId + '/documents/private/'
    + opaqueId + EXTENSION_BY_MIME[mimeType];
};
