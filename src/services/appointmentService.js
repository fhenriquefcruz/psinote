import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { addActivity } from './activityService';

const COLLECTION = 'appointments';

export const APPOINTMENT_STATUSES = [
  'scheduled',
  'confirmed',
  'done',
  'canceled',
  'rescheduled',
  'missed'
];

export const APPOINTMENT_MODALITIES = [
  'in_person',
  'online',
  'other'
];

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

const parseLocalDate = (dateValue) => {
  const match = String(dateValue || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) throw new Error('Data de agendamento inválida.');

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0, 0);
};

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
};

const addMonthsClamped = (date, months) => {
  const originalDay = date.getDate();
  const target = new Date(date);
  target.setDate(1);
  target.setMonth(target.getMonth() + months);
  const lastDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0
  ).getDate();
  target.setDate(Math.min(originalDay, lastDay));
  return target;
};

const recurrenceDate = (startDate, kind, index) => {
  const date = parseLocalDate(startDate);

  if (kind === 'weekly') {
    date.setDate(date.getDate() + index * 7);
  } else if (kind === 'biweekly') {
    date.setDate(date.getDate() + index * 14);
  } else if (kind === 'monthly') {
    return toDateKey(addMonthsClamped(date, index));
  }

  return toDateKey(date);
};

const normalizeOccurrences = (recurrence) => {
  if (!recurrence || recurrence.kind === 'none') {
    return { kind: 'none', occurrences: 1 };
  }

  if (!['weekly', 'biweekly', 'monthly'].includes(recurrence.kind)) {
    throw new Error('Recorrência inválida.');
  }

  const occurrences = Number(recurrence.occurrences || 1);
  if (!Number.isInteger(occurrences) || occurrences < 2 || occurrences > 52) {
    throw new Error('A recorrência deve ter entre 2 e 52 ocorrências.');
  }

  return { kind: recurrence.kind, occurrences };
};

const makeSeriesId = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return 'series-' + Date.now() + '-' + Math.random().toString(36).slice(2);
};

const baseAppointmentData = (psychologistId, data) => ({
  patientId: data.patientId,
  patientName: data.patientName || 'Paciente',
  time: data.time,
  duration: Number(data.duration || 50),
  modality: data.modality || 'in_person',
  notes: data.notes || '',
  psychologistId,
  status: 'scheduled',
  cancelReason: '',
  recordCompletedAt: null,
  sessionId: null,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  createdBy: psychologistId,
  updatedBy: psychologistId
});

export const createAppointmentSeries = async (
  psychologistId,
  data,
  recurrence = { kind: 'none', occurrences: 1 }
) => {
  if (!psychologistId) throw new Error('Usuário não autenticado.');
  if (!data.patientId || !data.date || !data.time) {
    throw new Error('Paciente, data e horário são obrigatórios.');
  }

  const normalizedRecurrence = normalizeOccurrences(recurrence);
  const batch = writeBatch(db);
  const seriesId =
    normalizedRecurrence.occurrences > 1 ? makeSeriesId() : null;
  const created = [];

  for (let index = 0; index < normalizedRecurrence.occurrences; index += 1) {
    const appointmentRef = doc(collection(db, COLLECTION));
    const appointmentData = {
      ...baseAppointmentData(psychologistId, data),
      date: recurrenceDate(data.date, normalizedRecurrence.kind, index),
      recurrence: {
        kind: normalizedRecurrence.kind,
        seriesId,
        index,
        total: normalizedRecurrence.occurrences
      }
    };

    batch.set(appointmentRef, appointmentData);
    created.push({ id: appointmentRef.id, ...appointmentData });
  }

  await batch.commit();

  await addActivity({
    psychologistId,
    user: psychologistId,
    action:
      normalizedRecurrence.occurrences > 1
        ? 'appointment.series_created'
        : 'appointment.created',
    target: 'appointment',
    targetId: created[0].id
  });

  return created;
};

export const createAppointment = async (psychologistId, data) => {
  const [appointment] = await createAppointmentSeries(
    psychologistId,
    data,
    { kind: 'none', occurrences: 1 }
  );
  return appointment;
};

export const getAppointments = async (psychologistId, startDate, endDate) => {
  let appointmentsQuery = query(
    collection(db, COLLECTION),
    where('psychologistId', '==', psychologistId),
    orderBy('date', 'asc')
  );

  if (startDate) {
    appointmentsQuery = query(
      appointmentsQuery,
      where('date', '>=', startDate)
    );
  }

  if (endDate) {
    appointmentsQuery = query(
      appointmentsQuery,
      where('date', '<=', endDate)
    );
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
  if (!APPOINTMENT_STATUSES.includes(status)) {
    throw new Error('Status de agendamento inválido.');
  }

  const { appointmentRef, data } = await getOwnedAppointmentSnapshot(
    appointmentId,
    psychologistId
  );

  if (!data) throw new Error('Agendamento não encontrado.');

  if (['done', 'canceled', 'rescheduled', 'missed'].includes(data.status)) {
    throw new Error('Este atendimento já está em estado final.');
  }

  const updateData = {
    status,
    updatedAt: serverTimestamp(),
    updatedBy: psychologistId
  };

  if (status === 'canceled') {
    if (!cancelReason.trim()) {
      throw new Error('Informe o motivo do cancelamento.');
    }
    updateData.cancelReason = cancelReason.trim();
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

export const updateAppointment = async (
  appointmentId,
  psychologistId,
  data
) => {
  const { appointmentRef, data: currentData } =
    await getOwnedAppointmentSnapshot(appointmentId, psychologistId);

  if (!currentData) throw new Error('Agendamento não encontrado.');
  if (['done', 'canceled', 'rescheduled', 'missed'].includes(currentData.status)) {
    throw new Error('Atendimentos encerrados não podem ser editados diretamente.');
  }

  const safeData = {
    time: data.time ?? currentData.time,
    duration: Number(data.duration ?? currentData.duration ?? 50),
    modality: data.modality ?? currentData.modality ?? 'in_person',
    notes: data.notes ?? currentData.notes ?? '',
    updatedAt: serverTimestamp(),
    updatedBy: psychologistId
  };

  await updateDoc(appointmentRef, safeData);

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
  const { appointmentRef, data: currentData } =
    await getOwnedAppointmentSnapshot(appointmentId, psychologistId);

  if (!currentData) throw new Error('Agendamento não encontrado.');

  const newAppointmentRef = doc(collection(db, COLLECTION));
  const batch = writeBatch(db);

  batch.update(appointmentRef, {
    status:
      ['scheduled', 'confirmed'].includes(currentData.status)
        ? 'rescheduled'
        : currentData.status,
    rescheduledAt: serverTimestamp(),
    rescheduledToId: newAppointmentRef.id,
    updatedAt: serverTimestamp(),
    updatedBy: psychologistId
  });

  const newAppointment = {
    ...baseAppointmentData(psychologistId, currentData),
    date: newDate,
    time: newTime,
    rescheduledFromId: appointmentId,
    recurrence: {
      kind: 'none',
      seriesId: null,
      index: 0,
      total: 1
    }
  };

  batch.set(newAppointmentRef, newAppointment);
  await batch.commit();

  await addActivity({
    psychologistId,
    user: psychologistId,
    action: 'appointment.rescheduled',
    target: 'appointment',
    targetId: appointmentId
  });

  return { id: newAppointmentRef.id, ...newAppointment };
};

export const markAppointmentRecordCompleted = async (
  appointmentId,
  psychologistId,
  sessionId
) => {
  if (!appointmentId) return;

  const { appointmentRef, data } = await getOwnedAppointmentSnapshot(
    appointmentId,
    psychologistId
  );

  if (!data) throw new Error('Agendamento não encontrado.');
  if (data.status !== 'done') {
    throw new Error('Somente atendimentos realizados podem receber registro.');
  }

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
