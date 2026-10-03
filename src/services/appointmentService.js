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
import {
  APPOINTMENT_STATUSES,
  buildRecurringDateKeys,
  canRescheduleAppointment,
  isAppointmentTerminal,
  normalizeAppointmentRecurrence
} from '../domain/appointments';

const COLLECTION = 'appointments';

export {
  APPOINTMENT_STATUSES,
  APPOINTMENT_MODALITIES
} from '../domain/appointments';

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

  const normalizedRecurrence = normalizeAppointmentRecurrence(recurrence);
  const dates = buildRecurringDateKeys(data.date, normalizedRecurrence);
  const batch = writeBatch(db);
  const seriesId =
    normalizedRecurrence.occurrences > 1 ? makeSeriesId() : null;
  const created = [];

  for (let index = 0; index < dates.length; index += 1) {
    const appointmentRef = doc(collection(db, COLLECTION));
    const appointmentData = {
      ...baseAppointmentData(psychologistId, data),
      date: dates[index],
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

  if (isAppointmentTerminal(data.status)) {
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
  if (isAppointmentTerminal(currentData.status)) {
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
  if (!canRescheduleAppointment(currentData.status)) {
    throw new Error('Este atendimento não pode ser remarcado.');
  }

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
