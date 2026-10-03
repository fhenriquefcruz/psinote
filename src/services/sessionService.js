import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { addActivity } from './activityService';
import {
  safelySyncSearchEntry,
  syncSessionSearchEntry
} from './searchIndexService';

const COLLECTION = 'sessions';
const VERSION_COLLECTION = 'session_versions';

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

const sessionVersionSnapshot = (data) => ({
  appointmentId: data.appointmentId || null,
  sessionNumber: data.sessionNumber || null,
  patientName: data.patientName || null,
  date: data.date || null,
  mainTheme: data.mainTheme || '',
  observations: data.observations || '',
  evolution: data.evolution || '',
  interventions: data.interventions || '',
  referrals: data.referrals || '',
  agreements: data.agreements || '',
  nextSteps: data.nextSteps || '',
  tags: Array.isArray(data.tags) ? data.tags : [],
  status: data.status || 'draft',
  finalizedAt: data.finalizedAt || null,
  reopenedAt: data.reopenedAt || null
});

const persistVersionedUpdate = async (
  sessionId,
  psychologistId,
  data,
  { createVersion, reason }
) => {
  const sessionRef = doc(db, COLLECTION, sessionId);

  const result = await runTransaction(db, async (transaction) => {
    const sessionSnapshot = await transaction.get(sessionRef);

    if (!sessionSnapshot.exists()) {
      throw new Error('Sessão não encontrada.');
    }

    const currentData = sessionSnapshot.data();

    if (currentData.psychologistId !== psychologistId) {
      throw new Error('Sessão não encontrada ou acesso não autorizado.');
    }

    const currentVersion = currentData.version || 1;
    const currentRevision = currentData.revision || currentVersion;
    const nextVersion = createVersion ? currentVersion + 1 : currentVersion;
    const nextRevision = currentRevision + 1;

    let versionRef = null;
    let versionSnapshot = null;

    if (createVersion) {
      versionRef = doc(
        db,
        VERSION_COLLECTION,
        sessionId + '_v' + currentVersion
      );
      versionSnapshot = await transaction.get(versionRef);
    }

    const updateData = {
      ...data,
      psychologistId,
      updatedAt: serverTimestamp(),
      updatedBy: psychologistId,
      version: nextVersion,
      revision: nextRevision
    };

    if (createVersion && !versionSnapshot.exists()) {
      transaction.set(versionRef, {
        psychologistId,
        patientId: currentData.patientId,
        sessionId,
        version: currentVersion,
        revision: currentRevision,
        reason,
        snapshot: sessionVersionSnapshot(currentData),
        createdAt: serverTimestamp(),
        createdBy: psychologistId
      });
    }

    transaction.update(sessionRef, updateData);

    return {
      id: sessionId,
      ...updateData,
      previousVersionCaptured: createVersion
        ? {
            version: currentVersion,
            revision: currentRevision,
            reason
          }
        : null,
      searchMetadata: {
        ...currentData,
        ...data,
        status: data.status ?? currentData.status,
        version: nextVersion,
        revision: nextRevision
      }
    };
  });

  return result;
};

export const createSession = async (psychologistId, data) => {
  const sessionData = {
    ...data,
    psychologistId,
    status: data.status || 'draft',
    version: 1,
    revision: 1,
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

  await safelySyncSearchEntry(() =>
    syncSessionSearchEntry(docRef.id, psychologistId, sessionData)
  );

  return { id: docRef.id, ...sessionData };
};

export const getSessions = async (psychologistId, limitCount = 50) => {
  const sessionsQuery = query(
    collection(db, COLLECTION),
    where('psychologistId', '==', psychologistId),
    orderBy('date', 'desc'),
    limit(limitCount)
  );

  const querySnapshot = await getDocs(sessionsQuery);
  return querySnapshot.docs.map((snapshot) => ({
    id: snapshot.id,
    ...snapshot.data()
  }));
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

export const getSessionVersions = async (sessionId, psychologistId) => {
  const { data: currentData } = await getOwnedSessionSnapshot(
    sessionId,
    psychologistId
  );

  if (!currentData) return [];

  const versionsQuery = query(
    collection(db, VERSION_COLLECTION),
    where('psychologistId', '==', psychologistId),
    where('sessionId', '==', sessionId),
    orderBy('version', 'desc')
  );

  const querySnapshot = await getDocs(versionsQuery);
  const immutableVersions = querySnapshot.docs.map((snapshot) => ({
    id: snapshot.id,
    ...snapshot.data(),
    source: 'immutable'
  }));

  const legacyVersions = (currentData.previousVersions || [])
    .map((legacy, index) => ({
      id: sessionId + '_legacy_' + index,
      psychologistId,
      patientId: currentData.patientId,
      sessionId,
      version: legacy.version || index + 1,
      revision: legacy.revision || legacy.version || index + 1,
      reason: 'legacy-embedded',
      snapshot: sessionVersionSnapshot(legacy),
      createdAt: legacy.savedAt || legacy.updatedAt || null,
      createdBy: legacy.updatedBy || legacy.createdBy || psychologistId,
      source: 'legacy'
    }))
    .filter(
      (legacy) =>
        !immutableVersions.some(
          (current) => current.version === legacy.version
        )
    );

  return [...immutableVersions, ...legacyVersions].sort(
    (a, b) => (b.version || 0) - (a.version || 0)
  );
};

export const updateSession = async (
  sessionId,
  psychologistId,
  data,
  saveVersion = true,
  reason = 'manual-save'
) => {
  const result = await persistVersionedUpdate(
    sessionId,
    psychologistId,
    data,
    {
      createVersion: saveVersion,
      reason
    }
  );

  if (saveVersion) {
    await addActivity({
      psychologistId,
      user: psychologistId,
      action: 'session.updated',
      target: 'session',
      targetId: sessionId,
      details: { version: result.version }
    });

    await safelySyncSearchEntry(() =>
      syncSessionSearchEntry(
        sessionId,
        psychologistId,
        result.searchMetadata
      )
    );
  }

  return result;
};

export const autoSaveSession = async (sessionId, psychologistId, data) =>
  updateSession(sessionId, psychologistId, data, false, 'autosave');

export const finalizeSession = async (sessionId, psychologistId, data) => {
  const result = await updateSession(
    sessionId,
    psychologistId,
    {
      ...data,
      status: 'finalized',
      finalizedAt: serverTimestamp()
    },
    true,
    'finalize'
  );

  await addActivity({
    psychologistId,
    user: psychologistId,
    action: 'session.finalized',
    target: 'session',
    targetId: sessionId,
    details: { version: result.version }
  });

  return result;
};

export const reopenSession = async (sessionId, psychologistId) => {
  const result = await updateSession(
    sessionId,
    psychologistId,
    {
      status: 'draft',
      reopenedAt: serverTimestamp()
    },
    true,
    'reopen'
  );

  await addActivity({
    psychologistId,
    user: psychologistId,
    action: 'session.reopened',
    target: 'session',
    targetId: sessionId,
    details: { version: result.version }
  });

  return result;
};

export const duplicateSession = async (sessionId, psychologistId) => {
  const original = await getSessionById(sessionId, psychologistId);
  if (!original) throw new Error('Sessão não encontrada.');

  const omittedFields = new Set([
    'id',
    'createdAt',
    'updatedAt',
    'createdBy',
    'updatedBy',
    'finalizedAt',
    'reopenedAt',
    'previousVersions'
  ]);
  const rest = Object.fromEntries(
    Object.entries(original).filter(([key]) => !omittedFields.has(key))
  );

  const newData = {
    ...rest,
    psychologistId,
    sessionNumber: (rest.sessionNumber || 0) + 1,
    date: new Date(),
    status: 'draft',
    version: 1,
    revision: 1,
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

  await safelySyncSearchEntry(() =>
    syncSessionSearchEntry(docRef.id, psychologistId, newData)
  );

  return { id: docRef.id, ...newData };
};

export const archiveSession = async (sessionId, psychologistId) => {
  await updateSession(
    sessionId,
    psychologistId,
    { status: 'archived' },
    true,
    'archive'
  );

  await addActivity({
    psychologistId,
    user: psychologistId,
    action: 'session.archived',
    target: 'session',
    targetId: sessionId
  });
};

export const restoreSession = async (sessionId, psychologistId) => {
  await updateSession(
    sessionId,
    psychologistId,
    { status: 'draft' },
    true,
    'restore'
  );

  await addActivity({
    psychologistId,
    user: psychologistId,
    action: 'session.restored',
    target: 'session',
    targetId: sessionId
  });
};
