import { getBlob, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../firebase/config';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);

// Never put a patient identifier or uploaded filename in the object key.
// User-visible names remain only in owner-protected Firestore document metadata.
const MIME_EXTENSIONS = Object.freeze({
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
});

const randomId = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const validateDocumentFile = (file) => {
  if (!file) throw new Error('Arquivo não informado.');
  if (file.size <= 0) throw new Error('O arquivo está vazio.');
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('O arquivo excede o limite de 10 MB.');
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error('Formato de arquivo não permitido.');
  }
};

export const calculateSha256 = async (file) => {
  if (!globalThis.crypto?.subtle) return null;
  const bytes = await file.arrayBuffer();
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

export const uploadPrivateDocument = async (file, psychologistId, _patientId = null) => {
  validateDocumentFile(file);

  const path = `users/${psychologistId}/documents/private/${randomId()}${MIME_EXTENSIONS[file.type]}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file, {
    contentType: file.type,
    cacheControl: 'private,max-age=0,no-store'
  });

  return {
    storagePath: path,
    storageProvider: 'firebase',
    fileType: file.type,
    fileSize: file.size,
    sha256: await calculateSha256(file)
  };
};

export const getPrivateDocumentBlobUrl = async (storagePath) => {
  if (!storagePath) throw new Error('Documento sem caminho de armazenamento.');
  const blob = await getBlob(ref(storage, storagePath));
  return URL.createObjectURL(blob);
};

