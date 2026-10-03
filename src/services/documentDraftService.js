import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '../firebase/config';

const COLLECTION = 'document_drafts';

const randomId = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return 'draft-' + Date.now() + '-' + Math.random().toString(36).slice(2);
};

const assertDraftOwner = (data, psychologistId) => {
  if (!data || data.psychologistId !== psychologistId) {
    throw new Error('Rascunho não encontrado ou acesso não autorizado.');
  }
};

export const createDocumentDraft = async ({
  psychologistId,
  patientId = null,
  patientName = '',
  template,
  values,
  familyId = null,
  issueVersion = 1,
  supersedesDocumentId = null
}) => {
  if (!psychologistId) throw new Error('Usuário não autenticado.');
  if (!template?.id || !template?.version) {
    throw new Error('Template inválido.');
  }

  const draftRef = doc(collection(db, COLLECTION));
  const draftData = {
    psychologistId,
    patientId: patientId || null,
    patientName: patientName || '',
    templateId: template.id,
    templateVersion: template.version,
    templateType: template.type,
    templateFamily: template.family,
    values,
    status: 'draft',
    familyId: familyId || randomId(),
    issueVersion,
    supersedesDocumentId: supersedesDocumentId || null,
    issuedDocumentId: null,
    issuedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: psychologistId,
    updatedBy: psychologistId
  };

  await setDoc(draftRef, draftData);
  return { id: draftRef.id, ...draftData };
};

export const getDocumentDraft = async (draftId, psychologistId) => {
  if (!draftId) return null;
  const snapshot = await getDoc(doc(db, COLLECTION, draftId));
  if (!snapshot.exists()) return null;

  const data = snapshot.data();
  assertDraftOwner(data, psychologistId);
  return { id: snapshot.id, ...data };
};

export const getDocumentDrafts = async (psychologistId, patientId = null) => {
  let draftsQuery = query(
    collection(db, COLLECTION),
    where('psychologistId', '==', psychologistId),
    where('status', '==', 'draft'),
    orderBy('updatedAt', 'desc')
  );

  if (patientId) {
    draftsQuery = query(draftsQuery, where('patientId', '==', patientId));
  }

  const snapshot = await getDocs(draftsQuery);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
};

export const updateDocumentDraft = async (
  draftId,
  psychologistId,
  values
) => {
  const draft = await getDocumentDraft(draftId, psychologistId);
  if (!draft) throw new Error('Rascunho não encontrado.');
  if (draft.status !== 'draft') {
    throw new Error('Documento emitido não pode ser alterado.');
  }

  await updateDoc(doc(db, COLLECTION, draftId), {
    values,
    updatedAt: serverTimestamp(),
    updatedBy: psychologistId
  });

  return { ...draft, values };
};

export const markDocumentDraftIssued = async (
  draftId,
  psychologistId,
  issuedDocumentId
) => {
  const draft = await getDocumentDraft(draftId, psychologistId);
  if (!draft) throw new Error('Rascunho não encontrado.');
  if (draft.status !== 'draft') {
    throw new Error('Este rascunho já foi encerrado.');
  }

  await updateDoc(doc(db, COLLECTION, draftId), {
    status: 'issued',
    issuedDocumentId,
    issuedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: psychologistId
  });
};
