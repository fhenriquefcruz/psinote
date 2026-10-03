import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { getDocumentTemplate } from '../domain/documentTemplates';
import { metadataMatches, normalizeSearchText } from '../domain/search';
import { parseDateValue } from '../utils/date.js';

const MAX_PATIENTS = 60;
const MAX_SESSIONS = 40;
const MAX_DOCUMENTS = 40;
const MAX_DRAFTS = 25;
const MAX_RESULTS_PER_GROUP = 6;

const formatDate = (value) => {
  const date = parseDateValue(value);
  return date ? date.toLocaleDateString('pt-BR') : '';
};

const takeMatches = (items, term, getFields) =>
  items
    .filter((item) => metadataMatches(term, getFields(item)))
    .slice(0, MAX_RESULTS_PER_GROUP);

const patientProjection = (snapshot) => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    type: 'patient',
    title: data.name || 'Paciente',
    subtitle: 'Paciente ativo',
    route: '/patients/' + snapshot.id
  };
};

const sessionProjection = (snapshot) => {
  const data = snapshot.data();
  const number = data.sessionNumber ? 'Sessão ' + data.sessionNumber : 'Sessão';
  const date = formatDate(data.date);
  const status = data.status === 'finalized' ? 'Finalizada' : 'Rascunho';

  return {
    id: snapshot.id,
    type: 'session',
    title: data.patientName || 'Paciente',
    subtitle: [number, date, status].filter(Boolean).join(' • '),
    route: '/sessions/' + snapshot.id
  };
};

const documentProjection = (snapshot) => {
  const data = snapshot.data();
  const template = data.templateId
    ? getDocumentTemplate(data.templateId, data.templateVersion)
    : null;

  return {
    id: snapshot.id,
    type: 'document',
    title: data.name || template?.label || 'Documento',
    subtitle: [
      template?.label,
      data.status === 'issued' ? 'Emitido' : 'Anexo',
      data.version ? 'v' + data.version : null
    ].filter(Boolean).join(' • '),
    action: 'open-document'
  };
};

const draftProjection = (snapshot) => {
  const data = snapshot.data();
  const template = getDocumentTemplate(
    data.templateId,
    data.templateVersion
  );

  return {
    id: snapshot.id,
    type: 'draft',
    title: data.patientName || 'Paciente',
    subtitle: [
      template?.label || data.templateType || 'Documento',
      'Rascunho'
    ].join(' • '),
    route: '/documents/generate?draftId=' + snapshot.id
  };
};

export const globalSearch = async (psychologistId, term) => {
  const normalized = normalizeSearchText(term);

  if (!psychologistId || normalized.length < 2) {
    return {
      patients: [],
      sessions: [],
      documents: [],
      drafts: []
    };
  }

  const [
    patientsSnapshot,
    sessionsSnapshot,
    documentsSnapshot,
    draftsSnapshot
  ] = await Promise.all([
    getDocs(
      query(
        collection(db, 'patients'),
        where('psychologistId', '==', psychologistId),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(MAX_PATIENTS)
      )
    ),
    getDocs(
      query(
        collection(db, 'sessions'),
        where('psychologistId', '==', psychologistId),
        orderBy('date', 'desc'),
        limit(MAX_SESSIONS)
      )
    ),
    getDocs(
      query(
        collection(db, 'documents'),
        where('psychologistId', '==', psychologistId),
        orderBy('uploadedAt', 'desc'),
        limit(MAX_DOCUMENTS)
      )
    ),
    getDocs(
      query(
        collection(db, 'document_drafts'),
        where('psychologistId', '==', psychologistId),
        where('status', '==', 'draft'),
        orderBy('updatedAt', 'desc'),
        limit(MAX_DRAFTS)
      )
    )
  ]);

  const patientDocs = patientsSnapshot.docs;
  const sessionDocs = sessionsSnapshot.docs;
  const documentDocs = documentsSnapshot.docs;
  const draftDocs = draftsSnapshot.docs;

  return {
    patients: takeMatches(
      patientDocs,
      normalized,
      (snapshot) => {
        const data = snapshot.data();
        return [data.name];
      }
    ).map(patientProjection),

    sessions: takeMatches(
      sessionDocs,
      normalized,
      (snapshot) => {
        const data = snapshot.data();
        return [
          data.patientName,
          data.sessionNumber ? 'sessao ' + data.sessionNumber : '',
          formatDate(data.date),
          data.status
        ];
      }
    ).map(sessionProjection),

    documents: takeMatches(
      documentDocs,
      normalized,
      (snapshot) => {
        const data = snapshot.data();
        const template = data.templateId
          ? getDocumentTemplate(data.templateId, data.templateVersion)
          : null;

        return [
          data.name,
          template?.label,
          data.category,
          data.status,
          data.kind
        ];
      }
    ).map(documentProjection),

    drafts: takeMatches(
      draftDocs,
      normalized,
      (snapshot) => {
        const data = snapshot.data();
        const template = getDocumentTemplate(
          data.templateId,
          data.templateVersion
        );

        return [
          data.patientName,
          template?.label,
          data.templateType
        ];
      }
    ).map(draftProjection)
  };
};
