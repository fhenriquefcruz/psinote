import { 
  collection, addDoc, getDocs, updateDoc, deleteDoc, doc, 
  query, where, orderBy, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { addActivity } from './activityService';

const COLLECTION = 'appointments';

export const createAppointment = async (psychologistId, data) => {
  try {
    const appointmentData = {
      ...data,
      psychologistId,
      status: 'scheduled',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, COLLECTION), appointmentData);
    await addActivity({
      psychologistId,
      user: psychologistId,
      action: 'Consulta agendada',
      target: 'appointment',
      targetId: docRef.id,
      details: { patientName: data.patientName }
    });
    return { id: docRef.id, ...appointmentData };
  } catch (error) {
    console.error('Erro ao criar consulta:', error);
    throw error;
  }
};

export const getAppointments = async (psychologistId, startDate, endDate) => {
  try {
    let q = query(
      collection(db, COLLECTION),
      where('psychologistId', '==', psychologistId),
      orderBy('date', 'asc')
    );
    if (startDate) q = query(q, where('date', '>=', startDate));
    if (endDate) q = query(q, where('date', '<=', endDate));
    const querySnapshot = await getDocs(q);
    const appointments = [];
    querySnapshot.forEach((doc) => {
      appointments.push({ id: doc.id, ...doc.data() });
    });
    return appointments;
  } catch (error) {
    console.error('Erro ao buscar consultas:', error);
    throw error;
  }
};

export const updateAppointmentStatus = async (appointmentId, psychologistId, status) => {
  try {
    const docRef = doc(db, COLLECTION, appointmentId);
    await updateDoc(docRef, { status, updatedAt: serverTimestamp() });
    await addActivity({
      psychologistId,
      user: psychologistId,
      action: `Consulta ${status}`,
      target: 'appointment',
      targetId: appointmentId
    });
    return true;
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    throw error;
  }
};

export const updateAppointment = async (appointmentId, psychologistId, data) => {
  try {
    const docRef = doc(db, COLLECTION, appointmentId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    await addActivity({
      psychologistId,
      user: psychologistId,
      action: 'Consulta atualizada',
      target: 'appointment',
      targetId: appointmentId
    });
    return true;
  } catch (error) {
    console.error('Erro ao atualizar consulta:', error);
    throw error;
  }
};

export const rescheduleAppointment = async (appointmentId, psychologistId, newDate, newTime) => {
  try {
    const docRef = doc(db, COLLECTION, appointmentId);
    await updateDoc(docRef, {
      date: newDate,
      time: newTime,
      status: 'scheduled',
      updatedAt: serverTimestamp()
    });
    await addActivity({
      psychologistId,
      user: psychologistId,
      action: 'Consulta reagendada',
      target: 'appointment',
      targetId: appointmentId
    });
    return true;
  } catch (error) {
    console.error('Erro ao reagendar:', error);
    throw error;
  }
};

export const deleteAppointment = async (appointmentId, psychologistId) => {
  try {
    await deleteDoc(doc(db, COLLECTION, appointmentId));
    await addActivity({
      psychologistId,
      user: psychologistId,
      action: 'Consulta excluída',
      target: 'appointment',
      targetId: appointmentId
    });
    return true;
  } catch (error) {
    console.error('Erro ao excluir consulta:', error);
    throw error;
  }
};
