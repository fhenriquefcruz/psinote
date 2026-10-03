const FIREBASE_CODE_PATTERN =
  /^(auth|firestore|storage)\/[a-z0-9-]{1,64}$/;

const SAFE_CATEGORIES = new Set([
  'ui_crash',
  'unhandled_error',
  'unhandled_rejection',
  'operation_failure'
]);

const SAFE_SEVERITIES = new Set([
  'error',
  'warning'
]);

const truncateToken = (value, maxLength = 64) => {
  const normalized = String(value || '')
    .replace(/[^a-zA-Z0-9._/-]/g, '-')
    .slice(0, maxLength);

  return normalized || null;
};

export const routeKeyFromPath = (pathname = '') => {
  const path = String(pathname || '').replace(/\/+$/, '') || '/';

  if (/\/patients\/new$/.test(path)) return 'patients.new';
  if (/\/patients\/[^/]+$/.test(path)) return 'patients.detail';
  if (/\/patients$/.test(path)) return 'patients.list';
  if (/\/sessions\/new$/.test(path)) return 'sessions.new';
  if (/\/sessions\/[^/]+$/.test(path)) return 'sessions.workspace';
  if (/\/sessions$/.test(path)) return 'sessions.list';
  if (/\/documents\/generate/.test(path)) return 'documents.generate';
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

const safeErrorName = (error) => {
  const name = error && typeof error === 'object' && 'name' in error
    ? error.name
    : 'Error';

  return truncateToken(name, 48) || 'Error';
};

const safeErrorCode = (error) => {
  if (!error || typeof error !== 'object' || !('code' in error)) return null;

  const code = String(error.code || '');
  return FIREBASE_CODE_PATTERN.test(code) ? code : null;
};

const randomEventId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return (
    'diag-'
    + Date.now().toString(36)
    + '-'
    + Math.random().toString(36).slice(2, 10)
  );
};

export const createDiagnosticEvent = (
  error,
  context = {},
  timestamp = new Date()
) => {
  const category = SAFE_CATEGORIES.has(context.category)
    ? context.category
    : 'operation_failure';

  const severity = SAFE_SEVERITIES.has(context.severity)
    ? context.severity
    : 'error';

  const configuredBuildId = import.meta.env?.VITE_BUILD_SHA;

  return {
    schemaVersion: 1,
    eventId: randomEventId(),
    timestamp: timestamp.toISOString(),
    category,
    severity,
    operation: truncateToken(context.operation, 64),
    routeKey: truncateToken(
      context.routeKey || routeKeyFromPath(context.pathname),
      64
    ),
    errorName: safeErrorName(error),
    errorCode: safeErrorCode(error),
    buildId: /^[a-f0-9]{7,64}$/i.test(configuredBuildId || '')
      ? configuredBuildId
      : null
  };
};

export const sendDiagnosticEvent = (event) => {
  const endpoint = import.meta.env?.VITE_DIAGNOSTICS_ENDPOINT;

  if (!endpoint) {
    if (import.meta.env?.DEV) {
      console.error('[PsiNote diagnostic]', event);
    }
    return false;
  }

  try {
    const url = new URL(endpoint, window.location.origin);

    if (url.protocol !== 'https:' && url.hostname !== 'localhost') {
      return false;
    }

    const payload = JSON.stringify(event);

    if (navigator.sendBeacon) {
      return navigator.sendBeacon(
        url.toString(),
        new Blob([payload], { type: 'application/json' })
      );
    }

    fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: payload,
      keepalive: true,
      credentials: 'omit',
      referrerPolicy: 'no-referrer'
    }).catch(() => {});

    return true;
  } catch {
    return false;
  }
};

export const reportTechnicalError = (error, context = {}) => {
  const event = createDiagnosticEvent(error, context);
  sendDiagnosticEvent(event);
  return event.eventId;
};

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
