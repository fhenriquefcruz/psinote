// Diagnostic events contain only allowlisted technical metadata.
// Never include error.message, stack, URL, account, record, user or clinical text.
const CATEGORIES = new Set(['ui_crash', 'unhandled_error', 'unhandled_rejection', 'operation_failure']);
const SEVERITIES = new Set(['error', 'warning']);
const OPERATIONS = new Set(['react.render', 'window.error', 'window.unhandledrejection']);
const ERROR_NAMES = new Set(['Error', 'TypeError', 'ReferenceError', 'SyntaxError', 'RangeError', 'NetworkError', 'FirebaseError', 'ChunkLoadError']);
const ERROR_CODES = new Set([
  'auth/network-request-failed',
  'auth/too-many-requests',
  'auth/user-disabled',
  'auth/invalid-credential',
  'firestore/permission-denied',
  'firestore/unavailable',
  'storage/unauthorized',
  'storage/retry-limit-exceeded',
  'permission-denied',
  'unavailable',
  'resource-exhausted'
]);
const ROUTE_KEYS = new Set([
  'patients.new', 'patients.detail', 'patients.list',
  'sessions.new', 'sessions.workspace', 'sessions.list',
  'documents.generate', 'documents.list', 'agenda', 'reports',
  'admin', 'settings', 'dashboard', 'auth.login', 'auth.register',
  'auth.reset', 'unknown'
]);
const MAX_LOCAL_EVENTS = 20;
const localEvents = [];

export const routeKeyFromPath = (pathname = '') => {
  const path = typeof pathname === 'string' ? pathname.replace(/\/+$/, '') : '';
  if (/\/patients\/new$/.test(path)) return 'patients.new';
  if (/\/patients\/edit\/[^/]+$/.test(path)) return 'patients.detail';
  if (/\/patients\/[^/]+$/.test(path)) return 'patients.detail';
  if (/\/patients$/.test(path)) return 'patients.list';
  if (/\/sessions\/new$/.test(path)) return 'sessions.new';
  if (/\/sessions\/[^/]+$/.test(path)) return 'sessions.workspace';
  if (/\/sessions$/.test(path)) return 'sessions.list';
  if (/\/documents\/generate(?:\/[^/]+)?$/.test(path)) return 'documents.generate';
  if (/\/documents$/.test(path)) return 'documents.list';
  if (/\/agenda$/.test(path)) return 'agenda';
  if (/\/reports$/.test(path)) return 'reports';
  if (/\/admin$/.test(path)) return 'admin';
  if (/\/settings$/.test(path)) return 'settings';
  if (/\/dashboard$/.test(path)) return 'dashboard';
  if (/\/login$/.test(path)) return 'auth.login';
  if (/\/register$/.test(path)) return 'auth.register';
  if (/\/forgot-password$/.test(path)) return 'auth.reset';
  return 'unknown';
};

const errorField = (error, field) => (
  error && typeof error === 'object' && field in error
    ? error[field]
    : null
);

const eventId = () => (
  typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : 'local-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
);

export const createDiagnosticEvent = (error, context = {}, timestamp = new Date()) => {
  const name = errorField(error, 'name');
  const code = errorField(error, 'code');
  const build = import.meta.env?.VITE_BUILD_SHA;
  return {
    schemaVersion: 1,
    eventId: eventId(),
    timestamp: timestamp.toISOString(),
    category: CATEGORIES.has(context.category) ? context.category : 'operation_failure',
    severity: SEVERITIES.has(context.severity) ? context.severity : 'error',
    operation: OPERATIONS.has(context.operation) ? context.operation : null,
    routeKey: ROUTE_KEYS.has(context.routeKey)
      ? context.routeKey
      : routeKeyFromPath(context.pathname),
    errorName: ERROR_NAMES.has(name) ? name : 'Error',
    errorCode: ERROR_CODES.has(code) ? code : null,
    buildId: typeof build === 'string' && /^[a-f0-9]{7,64}$/i.test(build) ? build : null
  };
};

// Deliberately in-memory only. No third-party telemetry, localStorage or network.
// A trusted, privacy-reviewed collector is a separate future backend task.
export const reportTechnicalError = (error, context = {}) => {
  const event = createDiagnosticEvent(error, context);
  localEvents.push(event);
  if (localEvents.length > MAX_LOCAL_EVENTS) localEvents.shift();
  return event.eventId;
};

export const readLocalDiagnosticEvents = () => localEvents.map((event) => ({ ...event }));
export const clearLocalDiagnosticEvents = () => { localEvents.length = 0; };

export const installGlobalDiagnostics = () => {
  if (typeof window === 'undefined') return () => {};

  const handleError = (event) => {
    reportTechnicalError(event.error, {
      category: 'unhandled_error',
      operation: 'window.error',
      pathname: window.location.pathname
    });
  };
  const handleRejection = (event) => {
    reportTechnicalError(event.reason, {
      category: 'unhandled_rejection',
      operation: 'window.unhandledrejection',
      pathname: window.location.pathname
    });
  };

  window.addEventListener('error', handleError);
  window.addEventListener('unhandledrejection', handleRejection);
  return () => {
    window.removeEventListener('error', handleError);
    window.removeEventListener('unhandledrejection', handleRejection);
  };
};
