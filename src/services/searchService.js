import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';

export const globalSearch = async (psychologistId, term) => {
  if (!term || term.length < 2) {
    return { patients: [], sessions: [], documents: [] };
  }

  const termLower = term.toLowerCase();
  const results = { patients: [], sessions: [], documents: [] };

  // Buscar pacientes
  try {
    const q = query(
      collection(db, 'patients'),
      where('psychologistId', '==', psychologistId),
      where('status', '==', 'active')
    );
    const snap = await getDocs(q);
    snap.forEach(doc => {
      const data = doc.data();
      const nameMatch = data.name?.toLowerCase().includes(termLower);
      const emailMatch = data.email?.toLowerCase().includes(termLower);
      const phoneMatch = data.phone?.includes(term);
      if (nameMatch || emailMatch || phoneMatch) {
        results.patients.push({ id: doc.id, ...data });
      }
    });
  } catch (e) {
    console.error('Erro na busca de pacientes:', e);
  }

  // Buscar sessões (limitado a 10)
  try {
    const q = query(
      collection(db, 'sessions'),
      where('psychologistId', '==', psychologistId),
      orderBy('date', 'desc'),
      limit(10)
    );
    const snap = await getDocs(q);
    snap.forEach(doc => {
      const data = doc.data();
      const themeMatch = data.mainTheme?.toLowerCase().includes(termLower);
      const evolutionMatch = data.clinicalEvolution?.toLowerCase().includes(termLower);
      const tagMatch = data.tags?.some(t => t.toLowerCase().includes(termLower));
      if (themeMatch || evolutionMatch || tagMatch) {
        results.sessions.push({ id: doc.id, ...data });
      }
    });
  } catch (e) {
    console.error('Erro na busca de sessões:', e);
  }

  // Buscar documentos
  try {
    const q = query(
      collection(db, 'documents'),
      where('psychologistId', '==', psychologistId),
      orderBy('uploadedAt', 'desc'),
      limit(10)
    );
    const snap = await getDocs(q);
    snap.forEach(doc => {
      const data = doc.data();
      if (data.name?.toLowerCase().includes(termLower)) {
        results.documents.push({ id: doc.id, ...data });
      }
    });
  } catch (e) {
    console.error('Erro na busca de documentos:', e);
  }

  return results;
};
