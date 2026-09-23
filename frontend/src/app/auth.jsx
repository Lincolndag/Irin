import { useEffect, useMemo, useState } from 'react';
import { AuthContext } from './auth-context';
import { clearSession, loadSession, setSession, SESSION_EVENT } from '../utils/session';
import { fetchCurrentUser, logoutUser } from '../utils/api';

export function AuthProvider({ children }) {
  const [session, setSessionState] = useState(() => loadSession());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const syncSession = (event) => {
      if (!isMounted) return;

      if (event?.detail === undefined) {
        setSessionState(loadSession());
        return;
      }

      setSessionState(event.detail);
    };

    const hydrateSession = async () => {
      try {
        const res = await fetchCurrentUser();
        const user = res?.data?.user ?? res?.user ?? null;

        if (!isMounted) return;

        if (user) {
          setSession(user);
          setSessionState(loadSession());
        } else {
          clearSession();
          setSessionState(null);
        }
      } catch {
        if (!isMounted) return;
        clearSession();
        setSessionState(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    window.addEventListener(SESSION_EVENT, syncSession);
    hydrateSession();

    return () => {
      isMounted = false;
      window.removeEventListener(SESSION_EVENT, syncSession);
    };
  }, []);

  const value = useMemo(() => {
    const user = session?.user ?? null;

    return {
      session,
      user,
      isAuthenticated: Boolean(user),
      loading,
      login: setSession,
      logout: async () => {
        try {
          await logoutUser();
        } catch {
          // If the server call fails, we still clear the local session.
        } finally {
          clearSession();
        }
      },
    };
  }, [loading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
