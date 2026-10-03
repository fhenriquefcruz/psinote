import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

const COLLECTION = 'activities';

const ALLOWED_DETAIL_KEYS = new Set([
  'version',
  'status',
  'patientId',
  'patientLinked',
  'fileType',
  'fileSize',
  'storageProvider',
  'originalId'
]);

const sanitizeDetails = (details = {}) =>
  Object.fromEntries(
    Object.entries(details).filter(([key]) => ALLOWED_DETAIL_KEYS.has(key))
  );

export const addActivity = async (data) => {
  try {
    const activityData = {
      psychologistId: data.psychologistId,
      user: data.user,
      action: data.action,
      target: data.target,
      targetId: data.targetId,
      details: sanitizeDetails(data.details),
      timestamp: serverTimestamp()
    };

    await addDoc(collection(db, COLLECTION), activityData);
  } catch {
    // Audit telemetry must never leak clinical content through console output.
    // A failed client-side activity event cannot block the clinical workflow.
  }
};

export const getRecentActivities = async (psychologistId, limitCount = 10) => {
  try {
    const activitiesQuery = query(
      collection(db, COLLECTION),
      where('psychologistId', '==', psychologistId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(activitiesQuery);
    return querySnapshot.docs.map((snapshot) => ({
      id: snapshot.id,
      ...snapshot.data()
    }));
  } catch {
    return [];
  }
};
