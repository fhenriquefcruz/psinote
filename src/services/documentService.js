import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  uploadPrivateDocument,
  getPrivateDocumentBlobUrl
} from './fileStorageService';
import { addActivity } from './activityService';
import { getDocumentDraft } from './documentDraftService';
import {
  DOCUMENT_KINDS,
  DOCUMENT_STATUSES,
  safeDocumentFileName
} from '../domain/documents';

const COLLECTION = 'documents';

const assertDocumentOwner = (data, psychologistId) => {
  if (!data || data.psychologistId !== psychologistId) {
    throw new Error('Documento não encontrado ou acesso não autorizado.');
  }
};

const baseFileMetadata = ({
  psychologistId,
  patientId,
  file,
  storedFile,
  name
}) => ({
  psychologistId,
  patientId: patientId || null,
  name: name || file.name,
  storageProvider: storedFile.storageProvider,
  storagePath: storedFile.storagePath,
  fileType: storedFile.fileType,
  fileSize: storedFile.fileSize,
  sha256: storedFile.sha256,
  uploadedAt: serverTimestamp(),
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  uploadedBy: psychologistId,
  createdBy: psychologistId,
  updatedBy: psychologistId
});

export const uploadDocument = async (
  psychologistId,
  file,
  patientId,
  category,
  name
) => {
  const storedFile = await uploadPrivateDocument(
    file,
    psychologistId,
    patientId
  );

  const docData = {
    ...baseFileMetadata({
      psychologistId,
      patientId,
      file,
      storedFile,
      name
    }),
    kind: DOCUMENT_KINDS.ATTACHMENT,
    status: DOCUMENT_STATUSES.STORED,
    category: category || 'other',
    version: 1,
    familyId: null,
    templateId: null,
    templateVersion: null,
    draftId: null,
    supersedesDocumentId: null,
    issuedAt: null
  };

  const docRef = await addDoc(collection(db, COLLECTION), docData);

  await addActivity({
    psychologistId,
    user: psychologistId,
    action: 'document.created',
    target: 'document',
    targetId: docRef.id,
    details: {
      patientLinked: Boolean(patientId),
      fileType: docData.fileType,
      fileSize: docData.fileSize,
      storageProvider: docData.storageProvider,
      status: docData.status,
      version: docData.version
    }
  });

  return { id: docRef.id, ...docData };
};

export const issueGeneratedDocument = async ({
  psychologistId,
  draftId,
  template,
  patient,
  file
}) => {
  if (!draftId) throw new Error('Salve o rascunho antes de emitir.');
  if (!template?.id || !template?.version) {
    throw new Error('Template inválido para emissão.');
  }

  const draft = await getDocumentDraft(draftId, psychologistId);
  if (!draft || draft.status !== 'draft') {
    throw new Error('Rascunho indisponível para emissão.');
  }

  if (
    draft.templateId !== template.id
    || draft.templateVersion !== template.version
  ) {
    throw new Error('A versão do template mudou. Reabra o rascunho antes de emitir.');
  }

  const expectedName = safeDocumentFileName(
    template.label,
    patient?.name || draft.patientName,
    draft.values?.issueDate
  );

  const issuedFile =
    file.name === expectedName
      ? file
      : new File([file], expectedName, { type: 'application/pdf' });

  const storedFile = await uploadPrivateDocument(
    issuedFile,
    psychologistId,
    draft.patientId
  );

  const documentRef = doc(collection(db, COLLECTION));
  const documentData = {
    ...baseFileMetadata({
      psychologistId,
      patientId: draft.patientId,
      file: issuedFile,
      storedFile,
      name: expectedName
    }),
    kind: DOCUMENT_KINDS.GENERATED,
    status: DOCUMENT_STATUSES.ISSUED,
    category: 'psychological_document',
    version: draft.issueVersion || 1,
    familyId: draft.familyId,
    templateId: draft.templateId,
    templateVersion: draft.templateVersion,
    templateType: draft.templateType,
    draftId: draft.id,
    supersedesDocumentId: draft.supersedesDocumentId || null,
    issuedAt: serverTimestamp(),
    issuedBy: psychologistId
  };

  const batch = writeBatch(db);
  batch.set(documentRef, documentData);
  batch.update(doc(db, 'document_drafts', draft.id), {
    status: 'issued',
    issuedDocumentId: documentRef.id,
    issuedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: psychologistId
  });
  await batch.commit();

  await addActivity({
    psychologistId,
    user: psychologistId,
    action: 'document.issued',
    target: 'document',
    targetId: documentRef.id,
    details: {
      patientLinked: Boolean(draft.patientId),
      fileType: documentData.fileType,
      fileSize: documentData.fileSize,
      storageProvider: documentData.storageProvider,
      status: documentData.status,
      version: documentData.version
    }
  });

  return { id: documentRef.id, ...documentData };
};

export const getDocuments = async (psychologistId, patientId = null) => {
  let documentsQuery = query(
    collection(db, COLLECTION),
    where('psychologistId', '==', psychologistId),
    orderBy('uploadedAt', 'desc')
  );

  if (patientId) {
    documentsQuery = query(
      documentsQuery,
      where('patientId', '==', patientId)
    );
  }

  const querySnapshot = await getDocs(documentsQuery);
  return querySnapshot.docs.map((snapshot) => ({
    id: snapshot.id,
    ...snapshot.data()
  }));
};

export const getDocumentById = async (documentId, psychologistId) => {
  const snapshot = await getDoc(doc(db, COLLECTION, documentId));
  if (!snapshot.exists()) return null;

  const data = snapshot.data();
  assertDocumentOwner(data, psychologistId);
  return { id: snapshot.id, ...data };
};

export const getDocumentAccessUrl = async (
  documentData,
  psychologistId
) => {
  assertDocumentOwner(documentData, psychologistId);

  if (
    documentData.storageProvider === 'firebase'
    && documentData.storagePath
  ) {
    return {
      url: await getPrivateDocumentBlobUrl(documentData.storagePath),
      revokeAfterUse: true
    };
  }

  if (documentData.fileURL) {
    return { url: documentData.fileURL, revokeAfterUse: false };
  }

  throw new Error('Arquivo indisponível.');
};
