import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  uploadPrivateDocument,
  getPrivateDocumentBlobUrl,
  deletePrivateDocument
} from './fileStorageService';
import { deleteFromSupabase } from './supabaseStorage';
import { addActivity } from './activityService';

const COLLECTION = 'documents';

const assertDocumentOwner = (data, psychologistId) => {
  if (!data || data.psychologistId !== psychologistId) {
    throw new Error('Documento não encontrado ou acesso não autorizado.');
  }
};

export const uploadDocument = async (psychologistId, file, patientId, category, name) => {
  const storedFile = await uploadPrivateDocument(file, psychologistId, patientId);

  const docData = {
    psychologistId,
    patientId: patientId || null,
    name: name || file.name,
    category: category || 'other',
    storageProvider: storedFile.storageProvider,
    storagePath: storedFile.storagePath,
    fileType: storedFile.fileType,
    fileSize: storedFile.fileSize,
    sha256: storedFile.sha256,
    version: 1,
    uploadedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    uploadedBy: psychologistId,
    createdBy: psychologistId,
    updatedBy: psychologistId
  };

  try {
    const docRef = await addDoc(collection(db, COLLECTION), docData);
    await addActivity({
      psychologistId,
      user: psychologistId,
      action: 'document.created',
      target: 'document',
      targetId: docRef.id,
      details: {
        category: docData.category,
        patientLinked: Boolean(patientId),
        fileType: docData.fileType,
        fileSize: docData.fileSize
      }
    });
    return { id: docRef.id, ...docData };
  } catch (error) {
    // Avoid orphaned uploads if metadata persistence fails.
    await deletePrivateDocument(storedFile.storagePath).catch(() => {});
    throw error;
  }
};

export const getDocuments = async (psychologistId, patientId = null) => {
  let documentsQuery = query(
    collection(db, COLLECTION),
    where('psychologistId', '==', psychologistId),
    orderBy('uploadedAt', 'desc')
  );

  if (patientId) {
    documentsQuery = query(documentsQuery, where('patientId', '==', patientId));
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

export const getDocumentAccessUrl = async (documentData, psychologistId) => {
  assertDocumentOwner(documentData, psychologistId);

  if (documentData.storageProvider === 'firebase' && documentData.storagePath) {
    return {
      url: await getPrivateDocumentBlobUrl(documentData.storagePath),
      revokeAfterUse: true
    };
  }

  // Transitional compatibility for legacy Supabase objects.
  // These records must be migrated because historical public URLs cannot be
  // made private merely by changing this frontend.
  if (documentData.fileURL) {
    return { url: documentData.fileURL, revokeAfterUse: false };
  }

  throw new Error('Arquivo indisponível.');
};

export const deleteDocument = async (documentId, psychologistId) => {
  const docRef = doc(db, COLLECTION, documentId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) throw new Error('Documento não encontrado.');

  const data = docSnap.data();
  assertDocumentOwner(data, psychologistId);

  if (data.storageProvider === 'firebase' && data.storagePath) {
    await deletePrivateDocument(data.storagePath);
  } else if (data.storagePath) {
    // Transitional support for legacy Supabase objects.
    await deleteFromSupabase(data.storagePath);
  }

  await deleteDoc(docRef);

  await addActivity({
    psychologistId,
    user: psychologistId,
    action: 'document.deleted',
    target: 'document',
    targetId: documentId,
    details: {
      storageProvider: data.storageProvider || 'legacy',
      patientLinked: Boolean(data.patientId)
    }
  });
};
