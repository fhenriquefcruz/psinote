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
