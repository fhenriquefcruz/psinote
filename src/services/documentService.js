import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { uploadToSupabase, deleteFromSupabase } from './supabaseStorage';
import { addActivity } from './activityService';

const COLLECTION = 'documents';

export const uploadDocument = async (psychologistId, file, patientId, category, name) => {
  try {
    // Faz upload para o Supabase Storage
    const result = await uploadToSupabase(file, psychologistId, patientId);

    // Salva metadados no Firestore
    const docData = {
      psychologistId,
      patientId: patientId || null,
      name: name || file.name,
      category: category || 'other',
      fileURL: result.fileURL,
      fileType: result.fileType,
      fileSize: result.fileSize,
      storagePath: result.path, // guarda o caminho para deletar depois
      uploadedAt: serverTimestamp(),
      uploadedBy: psychologistId,
    };

    const docRef = await addDoc(collection(db, COLLECTION), docData);

    await addActivity({
      psychologistId,
      user: psychologistId,
      action: 'Documento enviado',
      target: 'document',
      targetId: docRef.id,
      details: { fileName: file.name, patientId },
    });

    return { id: docRef.id, ...docData };
  } catch (error) {
    console.error('Erro ao enviar documento:', error);
    throw error;
  }
};

// Buscar documentos (igual antes)
export const getDocuments = async (psychologistId, patientId = null) => {
  // ... código igual ao original, só usa o Firestore
  try {
    let q = query(
      collection(db, COLLECTION),
      where('psychologistId', '==', psychologistId),
      orderBy('uploadedAt', 'desc')
    );
    if (patientId) {
      q = query(q, where('patientId', '==', patientId));
    }
    const querySnapshot = await getDocs(q);
    const documents = [];
    querySnapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() });
    });
    return documents;
  } catch (error) {
    console.error('Erro ao buscar documentos:', error);
    throw error;
  }
};

// Excluir documento (remove do Supabase e do Firestore)
export const deleteDocument = async (documentId, psychologistId) => {
  try {
    const docRef = doc(db, COLLECTION, documentId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error('Documento não encontrado');

    const data = docSnap.data();
    // Deleta do Supabase Storage
    if (data.storagePath) {
      await deleteFromSupabase(data.storagePath);
    }

    // Deleta do Firestore
    await deleteDoc(docRef);

    await addActivity({
      psychologistId,
      user: psychologistId,
      action: 'Documento removido',
      target: 'document',
      targetId: documentId,
    });
  } catch (error) {
    console.error('Erro ao excluir documento:', error);
    throw error;
  }
};
