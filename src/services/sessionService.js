import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { addActivity } from './activityService';

const COLLECTION = 'sessions';

const getOwnedSessionSnapshot = async (sessionId, psychologistId) => {
  if (!psychologistId) throw new Error('Usuário não autenticado.');

  const sessionRef = doc(db, COLLECTION, sessionId);
  const snapshot = await getDoc(sessionRef);

  if (!snapshot.exists()) return { sessionRef, snapshot, data: null };

  const data = snapshot.data();
  if (data.psychologistId !== psychologistId) {
    throw new Error('Sessão não encontrada ou acesso não autorizado.');
  }

  return { sessionRef, snapshot, data };
};

export const createSession = async (psychologistId, data) => {
  const sessionData = {
    ...data,
    psychologistId,
    status: 'scheduled',
    version: 1,
    previousVersions: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: psychologistId,
    updatedBy: psychologistId
  };

  const docRef = await addDoc(collection(db, COLLECTION), sessionData);
  await addActivity({
    psychologistId,
    user: psychologistId,
    action: 'session.created',
    target: 'session',
    targetId: docRef.id,
    details: { patientId: data.patientId }
  });

  return { id: docRef.id, ...sessionData };
};

export const getSessionsByPatient = async (patientId, psychologistId) => {
  const sessionsQuery = query(
    collection(db, COLLECTION),
    where('patientId', '==', patientId),
    where('psychologistId', '==', psychologistId),
    orderBy('date', 'desc')
  );

  const querySnapshot = await getDocs(sessionsQuery);
  return querySnapshot.docs.map((snapshot) => ({
    id: snapshot.id,
    ...snapshot.data()
  }));
};

export const getSessionById = async (sessionId, psychologistId) => {
  const { snapshot, data } = await getOwnedSessionSnapshot(sessionId, psychologistId);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...data };
};

export const updateSession = async (
  sessionId,
  psychologistId,
  data,
  saveVersion = true
) => {
  const { sessionRef, data: currentData } = await getOwnedSessionSnapshot(
    sessionId,
    psychologistId
  );

  if (!currentData) throw new Error('Sessão não encontrada.');

  let previousVersions = currentData.previousVersions || [];

  if (saveVersion) {
    const versionSnapshot = {
      ...currentData,
      version: currentData.version || 0,
      savedAt: new Date().toISOString()
    };
    delete versionSnapshot.previousVersions;

    previousVersions = [...previousVersions, versionSnapshot].slice(-10);
  }

  const updateData = {
    ...data,
    psychologistId,
    updatedAt: serverTimestamp(),
    updatedBy: psychologistId,
    version: (currentData.version || 0) + 1,
    previousVersions
  };

  await updateDoc(sessionRef, updateData);

  await addActivity({
    psychologistId,
    user: psychologistId,
    action: 'session.updated',
    target: 'session',
    targetId: sessionId,
    details: { version: updateData.version }
  });

  return { id: sessionId, ...updateData };
};

export const autoSaveSession = async (sessionId, psychologistId, data) =>
  updateSession(sessionId, psychologistId, data, false);

export const duplicateSession = async (sessionId, psychologistId) => {
  const original = await getSessionById(sessionId, psychologistId);
  if (!original) throw new Error('Sessão não encontrada.');

  const {
    id,
    createdAt,
    updatedAt,
    createdBy,
    updatedBy,
    previousVersions,
    ...rest
  } = original;

  const newData = {
    ...rest,
    psychologistId,
    sessionNumber: (rest.sessionNumber || 0) + 1,
    date: new Date(),
    status: 'scheduled',
    version: 1,
    previousVersions: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: psychologistId,
    updatedBy: psychologistId
  };

  const docRef = await addDoc(collection(db, COLLECTION), newData);
  await addActivity({
    psychologistId,
    user: psychologistId,
    action: 'session.duplicated',
    target: 'session',
    targetId: docRef.id,
    details: { originalId: sessionId }
  });

  return { id: docRef.id, ...newData };
};

export const archiveSession = async (sessionId, psychologistId) => {
  const { sessionRef } = await getOwnedSessionSnapshot(sessionId, psychologistId);

  await updateDoc(sessionRef, {
    status: 'archived',
    updatedAt: serverTimestamp(),
    updatedBy: psychologistId
  });

  await addActivity({
    psychologistId,
    user: psychologistId,
    action: 'session.archived',
    target: 'session',
    targetId: sessionId
  });
};

export const restoreSession = async (sessionId, psychologistId) => {
  const { sessionRef } = await getOwnedSessionSnapshot(sessionId, psychologistId);

  await updateDoc(sessionRef, {
    status: 'scheduled',
    updatedAt: serverTimestamp(),
    updatedBy: psychologistId
  });

  await addActivity({
    psychologistId,
    user: psychologistId,
    action: 'session.restored',
    target: 'session',
    targetId: sessionId
  });
};
