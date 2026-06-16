import { 
  collection, addDoc, getDocs, getDoc, updateDoc, deleteDoc, doc, 
  query, where, orderBy, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { addActivity } from './activityService';

const COLLECTION = 'patients';

// Criar paciente
export const createPatient = async (psychologistId, data) => {
  try {
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
      anamnesis: data.anamnesis || {
        chiefComplaint: '',
        familyHistory: '',
        medicalHistory: '',
        medications: '',
        therapeuticGoals: '',
        initialObservations: ''
      }
    };
    const docRef = await addDoc(collection(db, COLLECTION), patientData);
    await addActivity({
      psychologistId,
      user: psychologistId,
      action: 'Paciente criado',
      target: 'patient',
      targetId: docRef.id,
      details: { name: data.name }
    });
    return { id: docRef.id, ...patientData };
  } catch (error) {
    console.error('Erro ao criar paciente:', error);
    throw error;
  }
};

// Buscar pacientes do psicólogo (com filtro de status)
export const getPatients = async (psychologistId, status = 'active') => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('psychologistId', '==', psychologistId),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const patients = [];
    querySnapshot.forEach((doc) => {
      patients.push({ id: doc.id, ...doc.data() });
    });
    return patients;
  } catch (error) {
    console.error('Erro ao buscar pacientes:', error);
    throw error;
  }
};

// Buscar paciente por ID
export const getPatientById = async (patientId) => {
  try {
    const docRef = doc(db, COLLECTION, patientId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar paciente:', error);
    throw error;
  }
};

// Atualizar paciente
export const updatePatient = async (patientId, psychologistId, data) => {
  try {
    const docRef = doc(db, COLLECTION, patientId);
    const updateData = {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: psychologistId
    };
    await updateDoc(docRef, updateData);
    await addActivity({
      psychologistId,
      user: psychologistId,
      action: 'Paciente editado',
      target: 'patient',
      targetId: patientId,
      details: { name: data.name || 'Paciente' }
    });
    return { id: patientId, ...updateData };
  } catch (error) {
    console.error('Erro ao atualizar paciente:', error);
    throw error;
  }
};

// Arquivar paciente
export const archivePatient = async (patientId, psychologistId) => {
  try {
    const docRef = doc(db, COLLECTION, patientId);
    await updateDoc(docRef, {
      status: 'archived',
      updatedAt: serverTimestamp(),
      updatedBy: psychologistId
    });
    await addActivity({
      psychologistId,
      user: psychologistId,
      action: 'Paciente arquivado',
      target: 'patient',
      targetId: patientId
    });
  } catch (error) {
    console.error('Erro ao arquivar paciente:', error);
    throw error;
  }
};

// Restaurar paciente
export const restorePatient = async (patientId, psychologistId) => {
  try {
    const docRef = doc(db, COLLECTION, patientId);
    await updateDoc(docRef, {
      status: 'active',
      updatedAt: serverTimestamp(),
      updatedBy: psychologistId
    });
    await addActivity({
      psychologistId,
      user: psychologistId,
      action: 'Paciente restaurado',
      target: 'patient',
      targetId: patientId
    });
  } catch (error) {
    console.error('Erro ao restaurar paciente:', error);
    throw error;
  }
};

// Excluir permanentemente (vai para lixeira)
export const deletePatient = async (patientId, psychologistId) => {
  try {
    const docRef = doc(db, COLLECTION, patientId);
    await updateDoc(docRef, {
      deletedAt: serverTimestamp(),
      status: 'deleted',
      updatedAt: serverTimestamp(),
      updatedBy: psychologistId
    });
    await addActivity({
      psychologistId,
      user: psychologistId,
      action: 'Paciente excluído (lixeira)',
      target: 'patient',
      targetId: patientId
    });
  } catch (error) {
    console.error('Erro ao excluir paciente:', error);
    throw error;
  }
};

// Duplicar paciente
export const duplicatePatient = async (patientId, psychologistId) => {
  try {
    const original = await getPatientById(patientId);
    if (!original) throw new Error('Paciente não encontrado');
    const { id, createdAt, updatedAt, createdBy, updatedBy, ...rest } = original;
    const newData = {
      ...rest,
      name: `${rest.name} (cópia)`,
      psychologistId,
      status: 'active',
      isFavorite: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: psychologistId,
      updatedBy: psychologistId
    };
    const docRef = await addDoc(collection(db, COLLECTION), newData);
    await addActivity({
      psychologistId,
      user: psychologistId,
      action: 'Paciente duplicado',
      target: 'patient',
      targetId: docRef.id,
      details: { originalId: patientId }
    });
    return { id: docRef.id, ...newData };
  } catch (error) {
    console.error('Erro ao duplicar paciente:', error);
    throw error;
  }
};

// Busca global (pacientes)
export const searchPatients = async (psychologistId, searchTerm) => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('psychologistId', '==', psychologistId),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const patients = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const nameMatch = data.name.toLowerCase().includes(searchTerm.toLowerCase());
      const emailMatch = data.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const phoneMatch = data.phone?.includes(searchTerm);
      if (nameMatch || emailMatch || phoneMatch) {
        patients.push({ id: doc.id, ...data });
      }
    });
    return patients;
  } catch (error) {
    console.error('Erro na busca de pacientes:', error);
    throw error;
  }
};

// Buscar pacientes na lixeira (com expiração de 30 dias)
export const getTrashPatients = async (psychologistId) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const q = query(
      collection(db, COLLECTION),
      where('psychologistId', '==', psychologistId),
      where('status', '==', 'deleted'),
      where('deletedAt', '>=', thirtyDaysAgo)
    );
    const querySnapshot = await getDocs(q);
    const patients = [];
    querySnapshot.forEach((doc) => {
      patients.push({ id: doc.id, ...doc.data() });
    });
    return patients;
  } catch (error) {
    console.error('Erro ao buscar lixeira:', error);
    return [];
  }
};
