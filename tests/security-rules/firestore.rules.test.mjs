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
  updateDoc
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

const clinicalRecord = (owner, overrides = {}) => ({
  psychologistId: owner,
  patientId: 'patient-1',
  createdAt: '2026-10-03T00:00:00.000Z',
  updatedAt: '2026-10-03T00:00:00.000Z',
  createdBy: owner,
  updatedBy: owner,
  ...overrides
});

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
          status: 'draft'
        })
      ),
      setDoc(
        doc(db, 'appointments/alice-appointment'),
        clinicalRecord('alice', {
          status: 'scheduled'
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
