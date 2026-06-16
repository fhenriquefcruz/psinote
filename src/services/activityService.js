import { collection, addDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';

const COLLECTION = 'activities';

export const addActivity = async (data) => {
  try {
    const activityData = {
      ...data,
      timestamp: new Date().toISOString()
    };
    await addDoc(collection(db, COLLECTION), activityData);
  } catch (error) {
    console.error('Erro ao registrar atividade:', error);
  }
};

export const getRecentActivities = async (psychologistId, limitCount = 10) => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('psychologistId', '==', psychologistId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    const activities = [];
    querySnapshot.forEach((doc) => {
      activities.push({ id: doc.id, ...doc.data() });
    });
    return activities;
  } catch (error) {
    console.error('Erro ao buscar atividades:', error);
    return [];
  }
};
