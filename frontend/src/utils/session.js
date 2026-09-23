const SESSION_EVENT = 'irin:session-changed';
let currentSession = null;

const emitSessionChange = (session) => {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent(SESSION_EVENT, {
      detail: session,
    }),
  );
};

export function setSession(user) {
  currentSession = user ? { user } : null;

  if (typeof window === 'undefined') return;

  emitSessionChange(currentSession);
}

export function loadSession() {
  return currentSession;
}

export function clearSession() {
  currentSession = null;

  if (typeof window === 'undefined') return;

  emitSessionChange(null);
}

export { SESSION_EVENT };
