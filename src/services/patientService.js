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

const COLLECTION = 'patients';

const getOwnedPatientSnapshot = async (patientId, psychologistId) => {
  if (!psychologistId) throw new Error('Usuário não autenticado.');

  const patientRef = doc(db, COLLECTION, patientId);
  const snapshot = await getDoc(patientRef);

  if (!snapshot.exists()) return { patientRef, snapshot, data: null };

  const data = snapshot.data();
  if (data.psychologistId !== psychologistId) {
    throw new Error('Paciente não encontrado ou acesso não autorizado.');
  }

  return { patientRef, snapshot, data };
};

export const createPatient = async (psychologistId, data) => {
  const patientData = {
    ...data,
    psychologistId,
    status: 'active',
    isFavorite: false,
    deletedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: psychologistId,
    updatedBy: psychologistId,
    anamnesis: {
      chiefComplaint: data.anamnesis?.chiefComplaint || '',
      familyHistory: data.anamnesis?.familyHistory || '',
      medicalHistory: data.anamnesis?.medicalHistory || '',
      medications: data.anamnesis?.medications || '',
      therapeuticGoals: data.anamnesis?.therapeuticGoals || '',
      initialObservations: data.anamnesis?.initialObservations || ''
    }
  };

  const docRef = await addDoc(collection(db, COLLECTION), patientData);
  await addActivity({
    psychologistId,
    user: psychologistId,
    action: 'patient.created',
    target: 'patient',
    targetId: docRef.id
  });

  return { id: docRef.id, ...patientData };
};

export const getPatients = async (psychologistId, status = 'active') => {
  const patientsQuery = query(
    collection(db, COLLECTION),
    where('psychologistId', '==', psychologistId),
    where('status', '==', status),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(patientsQuery);
  return querySnapshot.docs.map((snapshot) => ({
    id: snapshot.id,
    ...snapshot.data()
  }));
};

export const getPatientById = async (patientId, psychologistId) => {
  const { snapshot, data } = await getOwnedPatientSnapshot(patientId, psychologistId);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...data };
};

export const updatePatient = async (patientId, psychologistId, data) => {
  const { patientRef } = await getOwnedPatientSnapshot(patientId, psychologistId);
  const updateData = {
    ...data,
    psychologistId,
    updatedAt: serverTimestamp(),
    updatedBy: psychologistId
  };

  await updateDoc(patientRef, updateData);
  await addActivity({
    psychologistId,
    user: psychologistId,
    action: 'patient.updated',
    target: 'patient',
    targetId: patientId
  });

  return { id: patientId, ...updateData };
};

export const archivePatient = async (patientId, psychologistId) => {
  const { patientRef } = await getOwnedPatientSnapshot(patientId, psychologistId);
  await updateDoc(patientRef, {
    status: 'archived',
    archivedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: psychologistId
  });

  await addActivity({
    psychologistId,
    user: psychologistId,
    action: 'patient.archived',
    target: 'patient',
    targetId: patientId
  });

  return true;
};

export const restorePatient = async (patientId, psychologistId) => {
  const { patientRef } = await getOwnedPatientSnapshot(patientId, psychologistId);
  await updateDoc(patientRef, {
    status: 'active',
    archivedAt: null,
    deletedAt: null,
    updatedAt: serverTimestamp(),
    updatedBy: psychologistId
  });

  await addActivity({
    psychologistId,
    user: psychologistId,
    action: 'patient.restored',
    target: 'patient',
    targetId: patientId
  });

  return true;
};

// This is intentionally a reversible soft-delete. Clinical records are not
// physically purged from a browser action.
export const deletePatient = async (patientId, psychologistId) => {
  const { patientRef } = await getOwnedPatientSnapshot(patientId, psychologistId);
  await updateDoc(patientRef, {
    deletedAt: serverTimestamp(),
    status: 'deleted',
    updatedAt: serverTimestamp(),
    updatedBy: psychologistId
  });

  await addActivity({
    psychologistId,
    user: psychologistId,
    action: 'patient.moved_to_trash',
    target: 'patient',
    targetId: patientId
  });

  return true;
};

export const getTrashPatients = async (psychologistId) =>
  getPatients(psychologistId, 'deleted');

export const duplicatePatient = async (patientId, psychologistId) => {
  const original = await getPatientById(patientId, psychologistId);
  if (!original) throw new Error('Paciente não encontrado.');

  const {
    id,
    createdAt,
    updatedAt,
    createdBy,
    updatedBy,
    deletedAt,
    archivedAt,
    ...rest
  } = original;

  const newData = {
    ...rest,
    name: `${rest.name} (cópia)`,
    psychologistId,
    status: 'active',
    isFavorite: false,
    deletedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: psychologistId,
    updatedBy: psychologistId
  };

  const docRef = await addDoc(collection(db, COLLECTION), newData);
  await addActivity({
    psychologistId,
    user: psychologistId,
    action: 'patient.duplicated',
    target: 'patient',
    targetId: docRef.id,
    details: { originalId: patientId }
  });

  return { id: docRef.id, ...newData };
};

export const searchPatients = async (psychologistId, searchTerm) => {
  const patientsQuery = query(
    collection(db, COLLECTION),
    where('psychologistId', '==', psychologistId),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(patientsQuery);
  const normalizedTerm = searchTerm.toLowerCase();

  return querySnapshot.docs
    .map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }))
    .filter((patient) => {
      const nameMatch = patient.name?.toLowerCase().includes(normalizedTerm);
      const emailMatch = patient.email?.toLowerCase().includes(normalizedTerm);
      const phoneMatch = patient.phone?.includes(searchTerm) || patient.whatsapp?.includes(searchTerm);
      return nameMatch || emailMatch || phoneMatch;
    });
};
