import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { isPrivateDocumentReference, buildPrivateStoragePath, sortDocumentsNewestFirst } from '../../src/domain/documentAccess.js';

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

describe('opaque private object keys', () => {
  test('never include the patient name or original file name', () => {
    const path = buildPrivateStoragePath(
      'professional-uid',
      'application/pdf',
      'c74be89a-1267-4482-95ee-5829858f449b'
    );
    assert.equal(path,
      'users/professional-uid/documents/private/c74be89a-1267-4482-95ee-5829858f449b.pdf');
    assert.equal(path.includes('patient'), false);
    assert.equal(path.includes('Ana Silva'), false);
  });

  test('invalid MIME types, path traversal and non-opaque identifiers are rejected', () => {
    assert.throws(() => buildPrivateStoragePath(
      'professional-uid', 'text/html', 'c74be89a-1267-4482-95ee-5829858f449b'
    ));
    assert.throws(() => buildPrivateStoragePath(
      'professional-uid/other', 'application/pdf', 'c74be89a-1267-4482-95ee-5829858f449b'
    ));
    assert.throws(() => buildPrivateStoragePath(
      'professional-uid', 'application/pdf', '../name-of-patient.pdf'
    ));
  });
});

describe('legacy document listing', () => {
  test('retains records without uploadedAt and sorts by available timestamps', () => {
    const list = [
      { id: 'old-unknown' },
      { id: 'recent', uploadedAt: { toMillis: () => 1200 } },
      { id: 'legacy-created', createdAt: new Date(1000) },
      { id: 'older', uploadedAt: new Date(500) }
    ];
    assert.deepEqual(
      sortDocumentsNewestFirst(list).map((item) => item.id),
      ['recent', 'legacy-created', 'older', 'old-unknown']
    );
    assert.equal(list[0].id, 'old-unknown');
  });
});
