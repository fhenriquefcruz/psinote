import fs from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} from '@firebase/rules-unit-testing';
import {
  deleteObject,
  getBytes,
  ref,
  uploadBytes
} from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';

const PROJECT_ID = 'demo-psinote-rules';
const BUCKET = 'gs://demo-psinote-rules.appspot.com';
let testEnv;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8')
    },
    storage: {
      rules: fs.readFileSync('storage.rules', 'utf8')
    }
  });
});

beforeEach(async () => {
  await testEnv.clearStorage();
  await testEnv.clearFirestore();

  await testEnv.withSecurityRulesDisabled(async (context) => {
    await Promise.all([
      setDoc(doc(context.firestore(), 'users/alice'), { blocked: false }),
      setDoc(doc(context.firestore(), 'users/bob'), { blocked: false }),
      setDoc(doc(context.firestore(), 'users/blocked'), { blocked: true })
    ]);

    await uploadBytes(
      ref(
        context.storage(BUCKET),
        'users/alice/documents/patient-1/existing.pdf'
      ),
      new Uint8Array([1, 2, 3]),
      { contentType: 'application/pdf' }
    );
  });
});

after(async () => {
  await testEnv.cleanup();
});

describe('Storage tenant isolation', () => {
  test('owner can create and read an allowed private document', async () => {
    const storage = testEnv.authenticatedContext('alice').storage(BUCKET);
    const fileRef = ref(
      storage,
      'users/alice/documents/patient-1/new-document.pdf'
    );

    await assertSucceeds(
      uploadBytes(fileRef, new Uint8Array([1, 2, 3]), {
        contentType: 'application/pdf'
      })
    );

    await assertSucceeds(getBytes(fileRef));
  });

  test('another user cannot read or write inside the owner path', async () => {
    const bobStorage = testEnv.authenticatedContext('bob').storage(BUCKET);

    await assertFails(
      getBytes(
        ref(
          bobStorage,
          'users/alice/documents/patient-1/existing.pdf'
        )
      )
    );

    await assertFails(
      uploadBytes(
        ref(
          bobStorage,
          'users/alice/documents/patient-1/forged.pdf'
        ),
        new Uint8Array([1]),
        { contentType: 'application/pdf' }
      )
    );
  });

  test('unauthenticated access is denied', async () => {
    const anonymous = testEnv.unauthenticatedContext().storage(BUCKET);

    await assertFails(
      getBytes(
        ref(
          anonymous,
          'users/alice/documents/patient-1/existing.pdf'
        )
      )
    );
  });
});

describe('Storage account lifecycle enforcement', () => {
  test('blocked owner cannot read an existing file or upload a new one', async () => {
    const blocked = testEnv.authenticatedContext('blocked').storage(BUCKET);
    const existing = ref(
      blocked,
      'users/blocked/documents/patient-1/existing.pdf'
    );
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await uploadBytes(
        ref(context.storage(BUCKET), existing.fullPath),
        new Uint8Array([1, 2, 3]),
        { contentType: 'application/pdf' }
      );
    });

    await assertFails(getBytes(existing));
    await assertFails(
      uploadBytes(
        ref(blocked, 'users/blocked/documents/patient-1/new.pdf'),
        new Uint8Array([1]),
        { contentType: 'application/pdf' }
      )
    );
  });

  test('authenticated user without profile cannot access private files', async () => {
    const missing = testEnv.authenticatedContext('unknown').storage(BUCKET);
    await assertFails(
      uploadBytes(
        ref(missing, 'users/unknown/documents/general/new.pdf'),
        new Uint8Array([1]),
        { contentType: 'application/pdf' }
      )
    );
  });
});

describe('Storage validation and immutability', () => {
  test('disallowed file type is rejected', async () => {
    const storage = testEnv.authenticatedContext('alice').storage(BUCKET);

    await assertFails(
      uploadBytes(
        ref(storage, 'users/alice/documents/patient-1/script.html'),
        new TextEncoder().encode('<script>alert(1)</script>'),
        { contentType: 'text/html' }
      )
    );
  });

  test('empty files are rejected', async () => {
    const storage = testEnv.authenticatedContext('alice').storage(BUCKET);

    await assertFails(
      uploadBytes(
        ref(storage, 'users/alice/documents/patient-1/empty.pdf'),
        new Uint8Array([]),
        { contentType: 'application/pdf' }
      )
    );
  });

  test('existing clinical file cannot be overwritten or deleted by browser client', async () => {
    const storage = testEnv.authenticatedContext('alice').storage(BUCKET);
    const existing = ref(
      storage,
      'users/alice/documents/patient-1/existing.pdf'
    );

    await assertFails(
      uploadBytes(existing, new Uint8Array([9, 9, 9]), {
        contentType: 'application/pdf'
      })
    );

    await assertFails(deleteObject(existing));
  });
});
