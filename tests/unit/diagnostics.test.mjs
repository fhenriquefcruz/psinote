import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  clearLocalDiagnosticEvents,
  createDiagnosticEvent,
  readLocalDiagnosticEvents,
  reportTechnicalError,
  routeKeyFromPath
} from '../../src/services/diagnosticsService.js';

describe('privacy-safe technical diagnostics', () => {
  test('removes clinical text, arbitrary fields, raw URLs and unknown names', () => {
    const patient = 'Maria Clínica Silva';
    const note = 'conteúdo sensível de sessão e hipótese diagnóstica';
    const error = Object.assign(new Error(note), {
      name: patient,
      code: 'storage/' + patient,
      stack: 'https://example.com/patients/123?token=secret',
      patientId: '123',
      token: 'secret'
    });
    const event = createDiagnosticEvent(error, {
      category: 'untrusted-category-' + patient,
      severity: 'other',
      operation: 'save.' + patient,
      routeKey: 'patients.' + patient,
      pathname: '/psinote/patients/123?token=secret',
      patientName: patient,
      narrative: note
    }, new Date('2026-11-17T00:00:00.000Z'));

    const serialized = JSON.stringify(event);
    for (const forbidden of [patient, note, 'secret', '/patients/123', 'example.com', 'patientId', 'token', 'narrative']) {
      assert.equal(serialized.includes(forbidden), false, forbidden);
    }
    assert.equal(event.category, 'operation_failure');
    assert.equal(event.operation, null);
    assert.equal(event.errorName, 'Error');
    assert.equal(event.errorCode, null);
    assert.equal(event.routeKey, 'patients.detail');
    assert.equal(event.timestamp, '2026-11-17T00:00:00.000Z');
  });

  test('retains only allowlisted error and operation classifications', () => {
    const event = createDiagnosticEvent({
      name: 'FirebaseError',
      code: 'auth/network-request-failed',
      message: 'a patient name',
      uid: 'private'
    }, {
      category: 'ui_crash',
      operation: 'react.render',
      routeKey: 'dashboard'
    });
    assert.equal(event.errorName, 'FirebaseError');
    assert.equal(event.errorCode, 'auth/network-request-failed');
    assert.equal(event.operation, 'react.render');
    assert.equal(event.routeKey, 'dashboard');
    assert.equal(Object.hasOwn(event, 'uid'), false);
    assert.equal(Object.hasOwn(event, 'message'), false);
  });

  test('keeps route ids private even in dynamic and unknown paths', () => {
    assert.equal(routeKeyFromPath('/psinote/patients/edit/sensitive-person-id'), 'patients.detail');
    assert.equal(routeKeyFromPath('/psinote/documents/generate/sensitive-person-id'), 'documents.generate');
    assert.equal(routeKeyFromPath('/psinote/sessions/secret-session-id'), 'sessions.workspace');
    assert.equal(routeKeyFromPath('/psinote/unknown?patient=PRIVATE'), 'unknown');
  });

  test('stores a bounded local copy, never the original error', () => {
    clearLocalDiagnosticEvents();
    for (let i = 0; i < 25; i += 1) {
      reportTechnicalError(new Error('patient name and clinical note'), {
        operation: 'window.error',
        pathname: '/psinote/patients/secret-id'
      });
    }
    const events = readLocalDiagnosticEvents();
    assert.equal(events.length, 20);
    assert.ok(events.every((event) => event.routeKey === 'patients.detail'));
    assert.equal(JSON.stringify(events).includes('clinical note'), false);
    events[0].category = 'tampered';
    assert.notEqual(readLocalDiagnosticEvents()[0].category, 'tampered');
    clearLocalDiagnosticEvents();
    assert.equal(readLocalDiagnosticEvents().length, 0);
  });
});
