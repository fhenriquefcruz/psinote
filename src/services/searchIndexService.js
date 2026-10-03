import {
  doc,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';

const COLLECTION = 'search_entries';

const entryId = (entityType, entityId) =>
  entityType + '_' + entityId;

const writeEntry = async ({
  psychologistId,
  entityType,
  entityId,
  patientId = null,
  title,
  status,
  searchable,
  date = null,
  sessionNumber = null,
  kind = null,
  templateId = null,
  templateVersion = null,
  version = null
}) => {
  if (!psychologistId || !entityId || !title) return;

  await setDoc(
    doc(db, COLLECTION, entryId(entityType, entityId)),
    {
      psychologistId,
      entityType,
      entityId,
      patientId: patientId || null,
      title: String(title),
      status: status || null,
      searchable: Boolean(searchable),
      date: date || null,
      sessionNumber: sessionNumber || null,
      kind: kind || null,
      templateId: templateId || null,
      templateVersion: templateVersion || null,
      version: version || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
};

export const syncPatientSearchEntry = async (
  patientId,
  psychologistId,
  patient
) =>
  writeEntry({
    psychologistId,
    entityType: 'patient',
    entityId: patientId,
    patientId,
    title: patient.name || 'Paciente',
    status: patient.status || 'active',
    searchable: patient.status === 'active'
  });

export const syncSessionSearchEntry = async (
  sessionId,
  psychologistId,
  session
) =>
  writeEntry({
    psychologistId,
    entityType: 'session',
    entityId: sessionId,
    patientId: session.patientId,
    title: session.patientName || 'Paciente',
    status: session.status || 'draft',
    searchable: session.status !== 'archived',
    date: session.date || null,
    sessionNumber: session.sessionNumber || null,
    version: session.version || 1
  });

export const syncDocumentSearchEntry = async (
  documentId,
  psychologistId,
  documentData
) =>
  writeEntry({
    psychologistId,
    entityType: 'document',
    entityId: documentId,
    patientId: documentData.patientId || null,
    title: documentData.name || 'Documento',
    status: documentData.status || 'stored',
    searchable: true,
    kind: documentData.kind || 'attachment',
    templateId: documentData.templateId || null,
    templateVersion: documentData.templateVersion || null,
    version: documentData.version || 1
  });

export const syncDraftSearchEntry = async (
  draftId,
  psychologistId,
  draftData
) =>
  writeEntry({
    psychologistId,
    entityType: 'draft',
    entityId: draftId,
    patientId: draftData.patientId || null,
    title: draftData.patientName || 'Paciente',
    status: draftData.status || 'draft',
    searchable: draftData.status === 'draft',
    kind: 'generated',
    templateId: draftData.templateId,
    templateVersion: draftData.templateVersion,
    version: draftData.issueVersion || 1
  });

export const safelySyncSearchEntry = async (syncOperation) => {
  try {
    await syncOperation();
  } catch {
    // Search metadata is derivative. The source record remains authoritative.
    // Backfill/reconciliation can restore missing index entries without
    // exposing clinical content to the search path.
  }
};
