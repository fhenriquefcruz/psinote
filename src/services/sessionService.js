import { 
  collection, addDoc, getDocs, getDoc, updateDoc, deleteDoc, doc, 
  query, where, orderBy, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { addActivity } from './activityService';

const COLLECTION = 'sessions';

export const createSession = async (psychologistId, data) => {
  try {
    const sessionData = {
      ...data,
      psychologistId,
      status: 'scheduled',
      version: 1,
      previousVersions: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, COLLECTION), sessionData);
    await addActivity({
      psychologistId,
      user: psychologistId,
      action: 'Sessão criada',
      target: 'session',
      targetId: docRef.id,
      details: { patientId: data.patientId }
    });
    return { id: docRef.id, ...sessionData };
  } catch (error) {
    console.error('Erro ao criar sessão:', error);
    throw error;
  }
};

export const getSessionsByPatient = async (patientId, psychologistId) => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('patientId', '==', patientId),
      where('psychologistId', '==', psychologistId),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const sessions = [];
    querySnapshot.forEach((doc) => {
      sessions.push({ id: doc.id, ...doc.data() });
    });
    return sessions;
  } catch (error) {
    console.error('Erro ao buscar sessões:', error);
    throw error;
  }
};

export const getSessionById = async (sessionId) => {
  try {
    const docRef = doc(db, COLLECTION, sessionId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar sessão:', error);
    throw error;
  }
};

export const updateSession = async (sessionId, psychologistId, data, saveVersion = true) => {
  try {
    const docRef = doc(db, COLLECTION, sessionId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error('Sessão não encontrada');
    const currentData = docSnap.data();
    let previousVersions = currentData.previousVersions || [];
    if (saveVersion) {
      const versionSnapshot = {
        ...currentData,
        version: currentData.version || 0,
        savedAt: new Date().toISOString()
      };
      delete versionSnapshot.previousVersions;
      previousVersions.push(versionSnapshot);
      if (previousVersions.length > 10) {
        previousVersions = previousVersions.slice(-10);
      }
    }
    const updateData = {
      ...data,
      updatedAt: serverTimestamp(),
      version: (currentData.version || 0) + 1,
      previousVersions
    };
    await updateDoc(docRef, updateData);
    await addActivity({
      psychologistId,
      user: psychologistId,
      action: 'Sessão editada',
      target: 'session',
      targetId: sessionId,
      details: { version: updateData.version }
    });
    return { id: sessionId, ...updateData };
  } catch (error) {
    console.error('Erro ao atualizar sessão:', error);
    throw error;
  }
};

export const autoSaveSession = async (sessionId, psychologistId, data) => {
  return updateSession(sessionId, psychologistId, data, false);
};

export const duplicateSession = async (sessionId, psychologistId) => {
  try {
    const original = await getSessionById(sessionId);
    if (!original) throw new Error('Sessão não encontrada');
    const { id, createdAt, updatedAt, ...rest } = original;
    const newData = {
      ...rest,
      sessionNumber: (rest.sessionNumber || 0) + 1,
      date: new Date(),
      status: 'scheduled',
      version: 1,
      previousVersions: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, COLLECTION), newData);
    await addActivity({
      psychologistId,
      user: psychologistId,
      action: 'Sessão duplicada',
      target: 'session',
      targetId: docRef.id,
      details: { originalId: sessionId }
    });
    return { id: docRef.id, ...newData };
  } catch (error) {
    console.error('Erro ao duplicar sessão:', error);
    throw error;
  }
};

export const archiveSession = async (sessionId, psychologistId) => {
  try {
    const docRef = doc(db, COLLECTION, sessionId);
    await updateDoc(docRef, { status: 'archived', updatedAt: serverTimestamp() });
    await addActivity({
      psychologistId,
      user: psychologistId,
      action: 'Sessão arquivada',
      target: 'session',
      targetId: sessionId
    });
  } catch (error) {
    console.error('Erro ao arquivar sessão:', error);
    throw error;
  }
};

export const restoreSession = async (sessionId, psychologistId) => {
  try {
    const docRef = doc(db, COLLECTION, sessionId);
    await updateDoc(docRef, { status: 'scheduled', updatedAt: serverTimestamp() });
    await addActivity({
      psychologistId,
      user: psychologistId,
      action: 'Sessão restaurada',
      target: 'session',
      targetId: sessionId
    });
  } catch (error) {
    console.error('Erro ao restaurar sessão:', error);
    throw error;
  }
};
