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

const COLLECTION = 'appointments';

const getOwnedAppointmentSnapshot = async (appointmentId, psychologistId) => {
  if (!psychologistId) throw new Error('Usuário não autenticado.');

  const appointmentRef = doc(db, COLLECTION, appointmentId);
  const snapshot = await getDoc(appointmentRef);

  if (!snapshot.exists()) return { appointmentRef, snapshot, data: null };

  const data = snapshot.data();
  if (data.psychologistId !== psychologistId) {
    throw new Error('Agendamento não encontrado ou acesso não autorizado.');
  }

  return { appointmentRef, snapshot, data };
};

export const createAppointment = async (psychologistId, data) => {
  const appointmentData = {
    ...data,
    psychologistId,
    status: 'scheduled',
    cancelReason: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: psychologistId,
    updatedBy: psychologistId
  };

  const docRef = await addDoc(collection(db, COLLECTION), appointmentData);
  await addActivity({
    psychologistId,
    user: psychologistId,
    action: 'appointment.created',
    target: 'appointment',
    targetId: docRef.id
  });

  return { id: docRef.id, ...appointmentData };
};

export const getAppointments = async (psychologistId, startDate, endDate) => {
  let appointmentsQuery = query(
    collection(db, COLLECTION),
    where('psychologistId', '==', psychologistId),
    orderBy('date', 'asc')
  );

  if (startDate) {
    appointmentsQuery = query(appointmentsQuery, where('date', '>=', startDate));
  }

  if (endDate) {
    appointmentsQuery = query(appointmentsQuery, where('date', '<=', endDate));
  }

  const querySnapshot = await getDocs(appointmentsQuery);
  return querySnapshot.docs.map((snapshot) => ({
    id: snapshot.id,
    ...snapshot.data()
  }));
};

export const getAppointmentsByPatient = async (psychologistId, patientId) => {
  const appointmentsQuery = query(
    collection(db, COLLECTION),
    where('psychologistId', '==', psychologistId),
    where('patientId', '==', patientId),
    orderBy('date', 'desc')
  );

  const querySnapshot = await getDocs(appointmentsQuery);
  return querySnapshot.docs.map((snapshot) => ({
    id: snapshot.id,
    ...snapshot.data()
  }));
};

export const updateAppointmentStatus = async (
  appointmentId,
  psychologistId,
  status,
  cancelReason = ''
) => {
  const { appointmentRef } = await getOwnedAppointmentSnapshot(
    appointmentId,
    psychologistId
  );

  const updateData = {
    status,
    updatedAt: serverTimestamp(),
    updatedBy: psychologistId
  };

  if (status === 'canceled') {
    updateData.cancelReason = cancelReason;
  }

  await updateDoc(appointmentRef, updateData);
  await addActivity({
    psychologistId,
    user: psychologistId,
    action: 'appointment.status_changed',
    target: 'appointment',
    targetId: appointmentId,
    details: { status }
  });

  return true;
};

export const updateAppointment = async (appointmentId, psychologistId, data) => {
  const { appointmentRef } = await getOwnedAppointmentSnapshot(
    appointmentId,
    psychologistId
  );

  await updateDoc(appointmentRef, {
    ...data,
    psychologistId,
    updatedAt: serverTimestamp(),
    updatedBy: psychologistId
  });

  await addActivity({
    psychologistId,
    user: psychologistId,
    action: 'appointment.updated',
    target: 'appointment',
    targetId: appointmentId
  });

  return true;
};

export const rescheduleAppointment = async (
  appointmentId,
  psychologistId,
  newDate,
  newTime
) => {
  const { appointmentRef } = await getOwnedAppointmentSnapshot(
    appointmentId,
    psychologistId
  );

  await updateDoc(appointmentRef, {
    date: newDate,
    time: newTime,
    status: 'scheduled',
    rescheduledAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: psychologistId
  });

  await addActivity({
    psychologistId,
    user: psychologistId,
    action: 'appointment.rescheduled',
    target: 'appointment',
    targetId: appointmentId
  });

  return true;
};



export const markAppointmentRecordCompleted = async (
  appointmentId,
  psychologistId,
  sessionId
) => {
  if (!appointmentId) return;

  const { appointmentRef } = await getOwnedAppointmentSnapshot(
    appointmentId,
    psychologistId
  );

  await updateDoc(appointmentRef, {
    recordCompletedAt: serverTimestamp(),
    sessionId,
    updatedAt: serverTimestamp(),
    updatedBy: psychologistId
  });

  await addActivity({
    psychologistId,
    user: psychologistId,
    action: 'appointment.record_completed',
    target: 'appointment',
    targetId: appointmentId
  });
};
