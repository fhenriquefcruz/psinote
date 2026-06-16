import { 
  collection, addDoc, getDocs, deleteDoc, doc, 
  query, where, orderBy, serverTimestamp, updateDoc
} from 'firebase/firestore';
import { 
  ref, uploadBytes, getDownloadURL, deleteObject 
} from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { addActivity } from './activityService';

const COLLECTION = 'documents';

export const uploadDocument = async (psychologistId, file, patientId, category, name) => {
  try {
    // Upload para Storage
    const storageRef = ref(storage, `psychologists/${psychologistId}/documents/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Salvar metadados no Firestore
    const docData = {
      psychologistId,
      patientId: patientId || null,
      name: name || file.name,
      category: category || 'other',
      fileURL: downloadURL,
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: serverTimestamp(),
      uploadedBy: psychologistId
    };
    
    const docRef = await addDoc(collection(db, COLLECTION), docData);
    
    await addActivity({
      psychologistId,
      user: psychologistId,
      action: 'Documento enviado',
      target: 'document',
      targetId: docRef.id,
      details: { fileName: file.name, patientId }
    });
    
    return { id: docRef.id, ...docData };
  } catch (error) {
    console.error('Erro ao enviar documento:', error);
    throw error;
  }
};

export const getDocuments = async (psychologistId, patientId = null) => {
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

export const deleteDocument = async (documentId, psychologistId) => {
  try {
    const docRef = doc(db, COLLECTION, documentId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error('Documento não encontrado');
    
    const data = docSnap.data();
    // Deletar do Storage
    const fileRef = ref(storage, data.fileURL);
    await deleteObject(fileRef);
    
    // Deletar do Firestore
    await deleteDoc(docRef);
    
    await addActivity({
      psychologistId,
      user: psychologistId,
      action: 'Documento removido',
      target: 'document',
      targetId: documentId
    });
  } catch (error) {
    console.error('Erro ao excluir documento:', error);
    throw error;
  }
};
