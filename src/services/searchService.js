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

const MAX_INDEX_ENTRIES = 160;
const MAX_RESULTS_PER_GROUP = 6;

const formatDate = (value) => {
  const date = parseDateValue(value);
  return date ? date.toLocaleDateString('pt-BR') : '';
};

const projectEntry = (snapshot) => {
  const data = snapshot.data();

  if (data.entityType === 'patient') {
    return {
      id: data.entityId,
      type: 'patient',
      title: data.title || 'Paciente',
      subtitle: 'Paciente ativo',
      route: '/patients/' + data.entityId
    };
  }

  if (data.entityType === 'session') {
    const number = data.sessionNumber
      ? 'Sessão ' + data.sessionNumber
      : 'Sessão';
    const status = data.status === 'finalized' ? 'Finalizada' : 'Rascunho';

    return {
      id: data.entityId,
      type: 'session',
      title: data.title || 'Paciente',
      subtitle: [
        number,
        formatDate(data.date),
        status
      ].filter(Boolean).join(' • '),
      route: '/sessions/' + data.entityId
    };
  }

  if (data.entityType === 'document') {
    const template = data.templateId
      ? getDocumentTemplate(data.templateId, data.templateVersion)
      : null;

    return {
      id: data.entityId,
      type: 'document',
      title: data.title || template?.label || 'Documento',
      subtitle: [
        template?.label,
        data.status === 'issued' ? 'Emitido' : 'Anexo',
        data.version ? 'v' + data.version : null
      ].filter(Boolean).join(' • '),
      action: 'open-document'
    };
  }

  if (data.entityType === 'draft') {
    const template = getDocumentTemplate(
      data.templateId,
      data.templateVersion
    );

    return {
      id: data.entityId,
      type: 'draft',
      title: data.title || 'Paciente',
      subtitle: [
        template?.label || 'Documento',
        'Rascunho'
      ].join(' • '),
      route: '/documents/generate?draftId=' + data.entityId
    };
  }

  return null;
};

const fieldsForSearch = (data) => {
  const template = data.templateId
    ? getDocumentTemplate(data.templateId, data.templateVersion)
    : null;

  return [
    data.title,
    data.entityType,
    data.status,
    data.sessionNumber ? 'sessao ' + data.sessionNumber : '',
    formatDate(data.date),
    template?.label,
    data.kind
  ];
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

  const snapshot = await getDocs(
    query(
      collection(db, 'search_entries'),
      where('psychologistId', '==', psychologistId),
      where('searchable', '==', true),
      orderBy('updatedAt', 'desc'),
      limit(MAX_INDEX_ENTRIES)
    )
  );

  const groups = {
    patients: [],
    sessions: [],
    documents: [],
    drafts: []
  };

  for (const item of snapshot.docs) {
    const data = item.data();
    if (!metadataMatches(normalized, fieldsForSearch(data))) continue;

    const projected = projectEntry(item);
    if (!projected) continue;

    const groupKey =
      projected.type === 'patient'
        ? 'patients'
        : projected.type === 'session'
          ? 'sessions'
          : projected.type === 'document'
            ? 'documents'
            : 'drafts';

    if (groups[groupKey].length < MAX_RESULTS_PER_GROUP) {
      groups[groupKey].push(projected);
    }
  }

  return groups;
};
