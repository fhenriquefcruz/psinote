import fs from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} from '@firebase/rules-unit-testing';
import {
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  writeBatch
} from 'firebase/firestore';

const PROJECT_ID = 'demo-psinote-rules';
let testEnv;

const profile = (overrides = {}) => ({
  name: 'Professional',
  email: 'professional@example.test',
  role: 'user',
  blocked: false,
  createdAt: '2026-10-03T00:00:00.000Z',
  updatedAt: '2026-10-03T00:00:00.000Z',
  ...overrides
});

const clinicalRecord = (owner, overrides = {}) => {
  const record = {
    psychologistId: owner,
    patientId: 'patient-1',
    createdAt: '2026-10-03T00:00:00.000Z',
    updatedAt: '2026-10-03T00:00:00.000Z',
    createdBy: owner,
    updatedBy: owner,
    ...overrides
  };

  if (
    Object.prototype.hasOwnProperty.call(overrides, 'patientId')
    && overrides.patientId === undefined
  ) {
    delete record.patientId;
  }

  return record;
};

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8')
    }
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    await Promise.all([
      setDoc(doc(db, 'users/alice'), profile({ email: 'alice@example.test' })),
      setDoc(doc(db, 'users/bob'), profile({ email: 'bob@example.test' })),
      setDoc(
        doc(db, 'users/blocked'),
        profile({ email: 'blocked@example.test', blocked: true })
      ),
      setDoc(
        doc(db, 'patients/alice-patient'),
        clinicalRecord('alice', {
          patientId: undefined,
          name: 'Alice patient',
          status: 'active'
        })
      ),
      setDoc(
        doc(db, 'patients/blocked-patient'),
        clinicalRecord('blocked', {
          patientId: undefined,
          name: 'Blocked patient',
          status: 'active'
        })
      ),
      setDoc(
        doc(db, 'sessions/alice-session'),
        clinicalRecord('alice', {
          mainTheme: 'Continuity',
          status: 'draft',
          version: 1,
          revision: 3
        })
      ),
      setDoc(
        doc(db, 'sessions/alice-finalized'),
        clinicalRecord('alice', {
          mainTheme: 'Finalized content',
          status: 'finalized',
          version: 2,
          revision: 5
        })
      ),
      setDoc(
        doc(db, 'appointments/alice-appointment'),
        clinicalRecord('alice', {
          status: 'scheduled',
          date: '2026-10-03',
          time: '09:00',
          recurrence: null,
          sessionId: null,
          recordCompletedAt: null
        })
      ),
      setDoc(
        doc(db, 'appointments/alice-done'),
        clinicalRecord('alice', {
          status: 'done',
          date: '2026-10-02',
          time: '10:00',
          recurrence: null,
          sessionId: null,
          recordCompletedAt: null
        })
      ),
      setDoc(
        doc(db, 'sessions/alice-other-patient'),
        clinicalRecord('alice', {
          patientId: 'patient-2',
          mainTheme: 'Other patient',
          status: 'finalized',
          version: 2,
          revision: 4
        })
      ),
      setDoc(
        doc(db, 'documents/alice-document'),
        clinicalRecord('alice', {
          storagePath: 'users/alice/documents/patient-1/example.pdf'
        })
      )
    ]);
  });
});

after(async () => {
  await testEnv.cleanup();
});

describe('Firestore tenant isolation', () => {
  test('owner can read own patient, another user and unauthenticated user cannot', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    const bob = testEnv.authenticatedContext('bob').firestore();
    const anonymous = testEnv.unauthenticatedContext().firestore();
    const patientRef = doc(alice, 'patients/alice-patient');

    await assertSucceeds(getDoc(patientRef));
    await assertFails(getDoc(doc(bob, 'patients/alice-patient')));
    await assertFails(getDoc(doc(anonymous, 'patients/alice-patient')));
  });

  test('owner cannot create a record for another tenant', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();

    await assertFails(
      setDoc(
        doc(alice, 'patients/forged-owner'),
        clinicalRecord('bob', {
          patientId: undefined,
          name: 'Forged',
          status: 'active'
        })
      )
    );
  });

  test('owner cannot transfer a session to another tenant or patient', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    const ref = doc(alice, 'sessions/alice-session');

    await assertFails(updateDoc(ref, { psychologistId: 'bob' }));
    await assertFails(updateDoc(ref, { patientId: 'patient-2' }));
  });

  test('creation metadata cannot be rewritten by the browser', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();

    await assertFails(
      updateDoc(doc(alice, 'patients/alice-patient'), {
        createdBy: 'bob'
      })
    );

    await assertFails(
      updateDoc(doc(alice, 'sessions/alice-session'), {
        createdAt: 'rewritten'
      })
    );
  });

  test('blocked user cannot read own clinical record', async () => {
    const blocked = testEnv.authenticatedContext('blocked').firestore();

    await assertFails(getDoc(doc(blocked, 'patients/blocked-patient')));
  });
});

describe('Firestore destructive operations', () => {
  test('browser clients cannot hard-delete clinical records', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();

    await assertFails(deleteDoc(doc(alice, 'patients/alice-patient')));
    await assertFails(deleteDoc(doc(alice, 'sessions/alice-session')));
    await assertFails(deleteDoc(doc(alice, 'appointments/alice-appointment')));
    await assertFails(deleteDoc(doc(alice, 'documents/alice-document')));
  });
});

describe('Account privilege boundaries', () => {
  test('regular user cannot promote own Firestore profile', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();

    await assertFails(
      updateDoc(doc(alice, 'users/alice'), {
        role: 'admin'
      })
    );
  });

  test('admin custom claim can inspect account profiles but not clinical records', async () => {
    const admin = testEnv.authenticatedContext('admin-user', {
      admin: true
    }).firestore();

    await assertSucceeds(getDoc(doc(admin, 'users/alice')));
    await assertFails(getDoc(doc(admin, 'patients/alice-patient')));
  });
});

describe('Audit activity rules', () => {
  test('valid minimized activity is append-only', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    const ref = doc(alice, 'activities/activity-1');

    await assertSucceeds(
      setDoc(ref, {
        psychologistId: 'alice',
        user: 'alice',
        action: 'session.updated',
        target: 'session',
        targetId: 'alice-session',
        details: { version: 2 },
        timestamp: '2026-10-03T00:00:00.000Z'
      })
    );

    await assertFails(updateDoc(ref, { action: 'session.finalized' }));
    await assertFails(deleteDoc(ref));
  });

  test('activity payload cannot smuggle clinical narrative', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();

    await assertFails(
      setDoc(doc(alice, 'activities/activity-sensitive'), {
        psychologistId: 'alice',
        user: 'alice',
        action: 'session.updated',
        target: 'session',
        targetId: 'alice-session',
        details: {
          version: 2,
          clinicalNarrative: 'sensitive narrative must not enter audit logs'
        },
        timestamp: '2026-10-03T00:00:00.000Z'
      })
    );
  });
});


describe('Immutable session version records', () => {
  const versionPayload = (owner = 'alice', overrides = {}) => ({
    psychologistId: owner,
    patientId: 'patient-1',
    sessionId: 'alice-session',
    version: 1,
    revision: 3,
    reason: 'manual-save',
    snapshot: {
      mainTheme: 'Continuity',
      status: 'draft'
    },
    createdAt: '2026-10-03T00:00:00.000Z',
    createdBy: owner,
    ...overrides
  });

  test('owner can append a version linked to an owned session', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();

    await assertSucceeds(
      setDoc(
        doc(alice, 'session_versions/alice-session_v1'),
        versionPayload()
      )
    );

    await assertSucceeds(
      getDoc(doc(alice, 'session_versions/alice-session_v1'))
    );
  });

  test('another tenant cannot append or read the version', async () => {
    const bob = testEnv.authenticatedContext('bob').firestore();

    await assertFails(
      setDoc(
        doc(bob, 'session_versions/forged'),
        versionPayload('bob', {
          patientId: 'patient-1',
          sessionId: 'alice-session',
          createdBy: 'bob'
        })
      )
    );

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), 'session_versions/alice-session_v1'),
        versionPayload()
      );
    });

    await assertFails(
      getDoc(doc(bob, 'session_versions/alice-session_v1'))
    );
  });

  test('version snapshot must match the actual parent state', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();

    await assertFails(
      setDoc(
        doc(alice, 'session_versions/alice-session_forged-snapshot'),
        versionPayload('alice', {
          snapshot: {
            mainTheme: 'Rewritten history',
            status: 'draft'
          }
        })
      )
    );
  });

  test('version cannot point to a different patient than its parent session', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();

    await assertFails(
      setDoc(
        doc(alice, 'session_versions/alice-session_wrong-patient'),
        versionPayload('alice', { patientId: 'patient-2' })
      )
    );
  });

  test('version records are immutable after creation', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    const ref = doc(alice, 'session_versions/alice-session_v1');

    await assertSucceeds(setDoc(ref, versionPayload()));
    await assertFails(updateDoc(ref, { reason: 'finalize' }));
    await assertFails(deleteDoc(ref));
  });

  test('unsupported reason and forged author are rejected', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();

    await assertFails(
      setDoc(
        doc(alice, 'session_versions/bad-reason'),
        versionPayload('alice', { reason: 'silent-rewrite' })
      )
    );

    await assertFails(
      setDoc(
        doc(alice, 'session_versions/forged-author'),
        versionPayload('alice', { createdBy: 'bob' })
      )
    );
  });
});


describe('Session lifecycle integrity', () => {
  test('ordinary browser update cannot skip revision sequencing', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();

    await assertFails(
      updateDoc(doc(alice, 'sessions/alice-session'), {
        mainTheme: 'Changed without revision'
      })
    );
  });

  test('draft autosave can keep formal version while incrementing revision', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();

    await assertSucceeds(
      updateDoc(doc(alice, 'sessions/alice-session'), {
        mainTheme: 'Autosaved change',
        updatedBy: 'alice',
        version: 1,
        revision: 4
      })
    );
  });

  test('finalized session cannot be silently edited while remaining finalized', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();

    await assertFails(
      updateDoc(doc(alice, 'sessions/alice-finalized'), {
        mainTheme: 'Silent rewrite',
        updatedBy: 'alice',
        version: 2,
        revision: 6,
        status: 'finalized'
      })
    );
  });

  test('finalized session may only return to editable draft through a new formal version', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();

    await assertSucceeds(
      updateDoc(doc(alice, 'sessions/alice-finalized'), {
        updatedBy: 'alice',
        version: 3,
        revision: 6,
        status: 'draft'
      })
    );
  });

  test('legacy embedded version history cannot be rewritten', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), 'sessions/alice-session'), {
        previousVersions: [{ version: 1, mainTheme: 'Legacy state' }]
      });
    });

    const alice = testEnv.authenticatedContext('alice').firestore();

    await assertFails(
      updateDoc(doc(alice, 'sessions/alice-session'), {
        previousVersions: [],
        updatedBy: 'alice',
        version: 1,
        revision: 4
      })
    );
  });
});


describe('Appointment lifecycle integrity', () => {
  const createPayload = (overrides = {}) => ({
    psychologistId: 'alice',
    patientId: 'patient-1',
    patientName: 'Alice patient',
    date: '2026-10-10',
    time: '14:00',
    duration: 50,
    modality: 'in_person',
    notes: '',
    status: 'scheduled',
    cancelReason: '',
    recordCompletedAt: null,
    sessionId: null,
    recurrence: {
      kind: 'weekly',
      seriesId: 'series-1',
      index: 0,
      total: 4
    },
    createdAt: '2026-10-03T00:00:00.000Z',
    updatedAt: '2026-10-03T00:00:00.000Z',
    createdBy: 'alice',
    updatedBy: 'alice',
    ...overrides
  });

  test('owner can create a scheduled recurring appointment but cannot forge terminal creation', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();

    await assertSucceeds(
      setDoc(doc(alice, 'appointments/new-series-item'), createPayload())
    );

    await assertFails(
      setDoc(
        doc(alice, 'appointments/forged-done'),
        createPayload({ status: 'done' })
      )
    );
  });

  test('another tenant cannot create an appointment for Alice', async () => {
    const bob = testEnv.authenticatedContext('bob').firestore();

    await assertFails(
      setDoc(
        doc(bob, 'appointments/forged-owner'),
        createPayload({
          psychologistId: 'alice',
          createdBy: 'bob',
          updatedBy: 'bob'
        })
      )
    );
  });

  test('scheduled appointment may be confirmed but its date and recurrence are immutable', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    const ref = doc(alice, 'appointments/alice-appointment');

    await assertSucceeds(
      updateDoc(ref, {
        status: 'confirmed',
        updatedBy: 'alice',
        updatedAt: '2026-10-03T01:00:00.000Z'
      })
    );

    await assertFails(
      updateDoc(ref, {
        date: '2026-10-20',
        updatedBy: 'alice',
        updatedAt: '2026-10-03T02:00:00.000Z'
      })
    );

    await assertFails(
      updateDoc(ref, {
        recurrence: { kind: 'monthly', seriesId: 'forged', index: 0, total: 3 },
        updatedBy: 'alice',
        updatedAt: '2026-10-03T02:00:00.000Z'
      })
    );
  });

  test('completed appointment cannot be reopened to scheduled state', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();

    await assertFails(
      updateDoc(doc(alice, 'appointments/alice-done'), {
        status: 'scheduled',
        updatedBy: 'alice',
        updatedAt: '2026-10-03T02:00:00.000Z'
      })
    );
  });

  test('completed appointment can link only to a finalized session for the same patient', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    const appointmentRef = doc(alice, 'appointments/alice-done');

    await assertSucceeds(
      updateDoc(appointmentRef, {
        sessionId: 'alice-finalized',
        recordCompletedAt: '2026-10-03T03:00:00.000Z',
        updatedBy: 'alice',
        updatedAt: '2026-10-03T03:00:00.000Z'
      })
    );

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), 'appointments/alice-done'), {
        sessionId: null,
        recordCompletedAt: null
      });
    });

    await assertFails(
      updateDoc(appointmentRef, {
        sessionId: 'alice-session',
        recordCompletedAt: '2026-10-03T03:00:00.000Z',
        updatedBy: 'alice',
        updatedAt: '2026-10-03T03:00:00.000Z'
      })
    );

    await assertFails(
      updateDoc(appointmentRef, {
        sessionId: 'alice-other-patient',
        recordCompletedAt: '2026-10-03T03:00:00.000Z',
        updatedBy: 'alice',
        updatedAt: '2026-10-03T03:00:00.000Z'
      })
    );
  });

  test('canceled or missed appointment may only receive reschedule linkage', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), 'appointments/alice-appointment'), {
        status: 'canceled'
      });
    });

    const alice = testEnv.authenticatedContext('alice').firestore();
    const ref = doc(alice, 'appointments/alice-appointment');

    await assertSucceeds(
      updateDoc(ref, {
        rescheduledToId: 'new-appointment-id',
        rescheduledAt: '2026-10-03T04:00:00.000Z',
        updatedBy: 'alice',
        updatedAt: '2026-10-03T04:00:00.000Z'
      })
    );

    await assertFails(
      updateDoc(ref, {
        notes: 'Rewrite after cancellation',
        updatedBy: 'alice',
        updatedAt: '2026-10-03T05:00:00.000Z'
      })
    );
  });
});


describe('Document draft and immutable issue lifecycle', () => {
  const draftPayload = (overrides = {}) => ({
    psychologistId: 'alice',
    patientId: 'alice-patient',
    patientName: 'Alice patient',
    templateId: 'system.declaration',
    templateVersion: 1,
    templateType: 'declaration',
    templateFamily: 'psychological',
    values: {
      purpose: 'Comprovação de comparecimento',
      place: 'Campo Grande - MS'
    },
    status: 'draft',
    familyId: 'family-1',
    issueVersion: 1,
    supersedesDocumentId: null,
    issuedDocumentId: null,
    issuedAt: null,
    createdAt: '2026-10-03T00:00:00.000Z',
    updatedAt: '2026-10-03T00:00:00.000Z',
    createdBy: 'alice',
    updatedBy: 'alice',
    ...overrides
  });

  const issuedDocumentPayload = (overrides = {}) => ({
    psychologistId: 'alice',
    patientId: 'alice-patient',
    name: 'Declaracao.pdf',
    storageProvider: 'firebase',
    storagePath: 'users/alice/documents/alice-patient/issued.pdf',
    fileType: 'application/pdf',
    fileSize: 2048,
    sha256: 'a'.repeat(64),
    uploadedAt: '2026-10-03T01:00:00.000Z',
    createdAt: '2026-10-03T01:00:00.000Z',
    updatedAt: '2026-10-03T01:00:00.000Z',
    uploadedBy: 'alice',
    createdBy: 'alice',
    updatedBy: 'alice',
    kind: 'generated',
    status: 'issued',
    category: 'psychological_document',
    version: 1,
    familyId: 'family-1',
    templateId: 'system.declaration',
    templateVersion: 1,
    templateType: 'declaration',
    draftId: 'draft-1',
    supersedesDocumentId: null,
    issuedAt: '2026-10-03T01:00:00.000Z',
    issuedBy: 'alice',
    ...overrides
  });

  const attachmentPayload = (overrides = {}) => ({
    psychologistId: 'alice',
    patientId: 'alice-patient',
    name: 'arquivo.pdf',
    storageProvider: 'firebase',
    storagePath: 'users/alice/documents/alice-patient/arquivo.pdf',
    fileType: 'application/pdf',
    fileSize: 1024,
    sha256: 'b'.repeat(64),
    uploadedAt: '2026-10-03T01:00:00.000Z',
    createdAt: '2026-10-03T01:00:00.000Z',
    updatedAt: '2026-10-03T01:00:00.000Z',
    uploadedBy: 'alice',
    createdBy: 'alice',
    updatedBy: 'alice',
    kind: 'attachment',
    status: 'stored',
    category: 'other',
    version: 1,
    familyId: null,
    templateId: null,
    templateVersion: null,
    draftId: null,
    supersedesDocumentId: null,
    issuedAt: null,
    ...overrides
  });

  test('owner can create and edit own draft while another tenant cannot read it', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    const bob = testEnv.authenticatedContext('bob').firestore();
    const ref = doc(alice, 'document_drafts/draft-1');

    await assertSucceeds(setDoc(ref, draftPayload()));
    await assertSucceeds(
      updateDoc(ref, {
        values: {
          purpose: 'Finalidade atualizada',
          place: 'Campo Grande - MS'
        },
        updatedAt: '2026-10-03T00:30:00.000Z',
        updatedBy: 'alice'
      })
    );

    await assertFails(getDoc(doc(bob, 'document_drafts/draft-1')));
  });

  test('draft cannot forge another patient, template or owner', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    const ref = doc(alice, 'document_drafts/draft-1');

    await assertSucceeds(setDoc(ref, draftPayload()));

    await assertFails(
      updateDoc(ref, {
        patientId: 'someone-else',
        updatedAt: '2026-10-03T00:30:00.000Z',
        updatedBy: 'alice'
      })
    );

    await assertFails(
      updateDoc(ref, {
        templateVersion: 99,
        updatedAt: '2026-10-03T00:30:00.000Z',
        updatedBy: 'alice'
      })
    );

    await assertFails(
      setDoc(
        doc(alice, 'document_drafts/forged-owner'),
        draftPayload({ psychologistId: 'bob' })
      )
    );
  });

  test('generated issued document requires paired draft transition in the same batch', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    const draftRef = doc(alice, 'document_drafts/draft-1');
    const documentRef = doc(alice, 'documents/issued-1');

    await assertSucceeds(setDoc(draftRef, draftPayload()));

    await assertFails(
      setDoc(documentRef, issuedDocumentPayload())
    );

    const batch = writeBatch(alice);
    batch.set(documentRef, issuedDocumentPayload());
    batch.update(draftRef, {
      status: 'issued',
      issuedDocumentId: 'issued-1',
      issuedAt: '2026-10-03T01:00:00.000Z',
      updatedAt: '2026-10-03T01:00:00.000Z',
      updatedBy: 'alice'
    });

    await assertSucceeds(batch.commit());

    await assertSucceeds(getDoc(documentRef));
  });

  test('issued draft and issued document are immutable in browser clients', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(
        doc(db, 'document_drafts/draft-1'),
        draftPayload({
          status: 'issued',
          issuedDocumentId: 'issued-1',
          issuedAt: '2026-10-03T01:00:00.000Z'
        })
      );
      await setDoc(
        doc(db, 'documents/issued-1'),
        issuedDocumentPayload()
      );
    });

    const alice = testEnv.authenticatedContext('alice').firestore();

    await assertFails(
      updateDoc(doc(alice, 'document_drafts/draft-1'), {
        values: { purpose: 'Reescrita posterior' },
        updatedAt: '2026-10-03T02:00:00.000Z',
        updatedBy: 'alice'
      })
    );

    await assertFails(
      updateDoc(doc(alice, 'documents/issued-1'), {
        name: 'alterado.pdf',
        updatedAt: '2026-10-03T02:00:00.000Z',
        updatedBy: 'alice'
      })
    );

    await assertFails(
      deleteDoc(doc(alice, 'documents/issued-1'))
    );
  });

  test('ordinary private attachment remains supported but metadata is immutable', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    const ref = doc(alice, 'documents/attachment-1');

    await assertSucceeds(setDoc(ref, attachmentPayload()));
    await assertFails(
      updateDoc(ref, {
        name: 'renamed.pdf',
        updatedAt: '2026-10-03T02:00:00.000Z',
        updatedBy: 'alice'
      })
    );
  });

  test('document creation cannot link to another tenant patient', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), 'patients/bob-patient'),
        clinicalRecord('bob', {
          patientId: undefined,
          name: 'Bob patient',
          status: 'active'
        })
      );
    });

    const alice = testEnv.authenticatedContext('alice').firestore();

    await assertFails(
      setDoc(
        doc(alice, 'documents/cross-patient'),
        attachmentPayload({ patientId: 'bob-patient' })
      )
    );

    await assertFails(
      setDoc(
        doc(alice, 'document_drafts/cross-patient'),
        draftPayload({ patientId: 'bob-patient' })
      )
    );
  });
});


describe('Privacy-safe search metadata index', () => {
  const baseEntry = (overrides = {}) => ({
    psychologistId: 'alice',
    entityType: 'patient',
    entityId: 'alice-patient',
    patientId: 'alice-patient',
    title: 'Alice patient',
    status: 'active',
    searchable: true,
    date: null,
    sessionNumber: null,
    kind: null,
    templateId: null,
    templateVersion: null,
    version: null,
    createdAt: '2026-10-03T00:00:00.000Z',
    updatedAt: '2026-10-03T00:00:00.000Z',
    ...overrides
  });

  test('owner can index exact patient metadata and another tenant cannot read it', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    const bob = testEnv.authenticatedContext('bob').firestore();
    const ref = doc(alice, 'search_entries/patient_alice-patient');

    await assertSucceeds(setDoc(ref, baseEntry()));
    await assertSucceeds(getDoc(ref));
    await assertFails(getDoc(doc(bob, 'search_entries/patient_alice-patient')));
  });

  test('patient index cannot falsify source title/searchability or add clinical narrative', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();

    await assertFails(
      setDoc(
        doc(alice, 'search_entries/forged-title'),
        baseEntry({ title: 'Outro nome' })
      )
    );

    await assertFails(
      setDoc(
        doc(alice, 'search_entries/forged-searchability'),
        baseEntry({ searchable: false })
      )
    );

    await assertFails(
      setDoc(
        doc(alice, 'search_entries/clinical-smuggle'),
        {
          ...baseEntry(),
          clinicalNarrative: 'conteúdo que nunca deve entrar no índice'
        }
      )
    );
  });

  test('session search entry is limited to source metadata', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), 'sessions/search-session'),
        clinicalRecord('alice', {
          patientId: 'alice-patient',
          patientName: 'Alice patient',
          status: 'finalized',
          date: '2026-10-01',
          sessionNumber: 3,
          version: 2,
          revision: 4
        })
      );
    });

    const alice = testEnv.authenticatedContext('alice').firestore();
    const payload = baseEntry({
      entityType: 'session',
      entityId: 'search-session',
      patientId: 'alice-patient',
      title: 'Alice patient',
      status: 'finalized',
      searchable: true,
      date: '2026-10-01',
      sessionNumber: 3,
      version: 2
    });

    await assertSucceeds(
      setDoc(
        doc(alice, 'search_entries/session_search-session'),
        payload
      )
    );

    await assertFails(
      setDoc(
        doc(alice, 'search_entries/session_forged'),
        {
          ...payload,
          entityId: 'search-session',
          title: 'Tema clínico inventado'
        }
      )
    );
  });

  test('generated document and draft metadata can be indexed without body content', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();

      await setDoc(
        doc(db, 'documents/search-document'),
        clinicalRecord('alice', {
          patientId: 'alice-patient',
          name: 'Declaracao.pdf',
          status: 'issued',
          kind: 'generated',
          templateId: 'system.declaration',
          templateVersion: 1,
          version: 1
        })
      );

      await setDoc(
        doc(db, 'document_drafts/search-draft'),
        clinicalRecord('alice', {
          patientId: 'alice-patient',
          patientName: 'Alice patient',
          status: 'draft',
          templateId: 'system.declaration',
          templateVersion: 1,
          issueVersion: 1
        })
      );
    });

    const alice = testEnv.authenticatedContext('alice').firestore();

    await assertSucceeds(
      setDoc(
        doc(alice, 'search_entries/document_search-document'),
        baseEntry({
          entityType: 'document',
          entityId: 'search-document',
          patientId: 'alice-patient',
          title: 'Declaracao.pdf',
          status: 'issued',
          searchable: true,
          kind: 'generated',
          templateId: 'system.declaration',
          templateVersion: 1,
          version: 1
        })
      )
    );

    await assertSucceeds(
      setDoc(
        doc(alice, 'search_entries/draft_search-draft'),
        baseEntry({
          entityType: 'draft',
          entityId: 'search-draft',
          patientId: 'alice-patient',
          title: 'Alice patient',
          status: 'draft',
          searchable: true,
          kind: 'generated',
          templateId: 'system.declaration',
          templateVersion: 1,
          version: 1
        })
      )
    );
  });

  test('index identity cannot be moved to another entity after creation', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    const ref = doc(alice, 'search_entries/patient_alice-patient');

    await assertSucceeds(setDoc(ref, baseEntry()));

    await assertFails(
      updateDoc(ref, {
        entityId: 'different-patient',
        updatedAt: '2026-10-03T01:00:00.000Z'
      })
    );
  });

  test('archived patient can only become non-searchable after source state changes', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    const ref = doc(alice, 'search_entries/patient_alice-patient');

    await assertSucceeds(setDoc(ref, baseEntry()));

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await updateDoc(
        doc(context.firestore(), 'patients/alice-patient'),
        { status: 'archived' }
      );
    });

    await assertSucceeds(
      updateDoc(ref, {
        status: 'archived',
        searchable: false,
        createdAt: '2026-10-03T00:00:00.000Z',
        updatedAt: '2026-10-03T02:00:00.000Z'
      })
    );
  });
});
