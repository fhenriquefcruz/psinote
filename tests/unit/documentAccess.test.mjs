import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { isPrivateDocumentReference } from '../../src/domain/documentAccess.js';

const owner = 'professional-uid';

describe('document access policy', () => {
  test('only scoped Firebase Storage paths are eligible for viewing', () => {
    assert.equal(isPrivateDocumentReference({
      psychologistId: owner,
      storageProvider: 'firebase',
      storagePath: 'users/professional-uid/documents/general/file.pdf'
    }, owner), true);
    assert.equal(isPrivateDocumentReference({
      psychologistId: owner,
      storageProvider: 'firebase',
      storagePath: 'users/professional-uid/documents/patient-1/opaque.pdf'
    }, owner), true);
  });

  test('legacy URLs, missing provider and other tenants never grant access', () => {
    const attempts = [
      { psychologistId: owner, fileURL: 'https://old.example/public/document.pdf' },
      {
        psychologistId: owner,
        storageProvider: 'supabase',
        fileURL: 'https://old.example/public/document.pdf',
        storagePath: 'users/professional-uid/documents/general/file.pdf'
      },
      {
        psychologistId: 'someone-else',
        storageProvider: 'firebase',
        storagePath: 'users/professional-uid/documents/general/file.pdf'
      },
      {
        psychologistId: owner,
        storageProvider: 'firebase',
        storagePath: 'users/someone-else/documents/general/file.pdf'
      },
      {
        psychologistId: owner,
        storageProvider: 'firebase',
        storagePath: 'users/professional-uid/documents/../file.pdf'
      },
      {
        psychologistId: owner,
        storageProvider: 'firebase',
        storagePath: 'users/professional-uid/documents//file.pdf'
      },
      {
        psychologistId: owner,
        storageProvider: 'firebase',
        storagePath: 'https://old.example/public/document.pdf'
      }
    ];
    for (const attempt of attempts) {
      assert.equal(isPrivateDocumentReference(attempt, owner), false);
    }
    assert.equal(isPrivateDocumentReference(null, owner), false);
  });
});
