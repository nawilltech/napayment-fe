import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { LoginRequest, SignupRequest } from '@napayment/api-client';
import { currentSession, loadSession, publicClient, saveSession, setSessionExpiredHandler } from '@/lib/api';
import { persister, queryClient } from '@/lib/query';

type Status = 'loading' | 'signedIn' | 'signedOut';

interface SessionContextValue {
  status: Status;
  signIn: (body: LoginRequest) => Promise<void>;
  signUp: (body: SignupRequest) => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/** Everything cached belongs to the signed-in user - drop it with them. */
async function clearUserData() {
  queryClient.getMutationCache().clear();
  queryClient.clear();
  await persister.removeClient();
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    loadSession()
      .then((s) => setStatus(s ? 'signedIn' : 'signedOut'))
      .catch(() => setStatus('signedOut'));
    setSessionExpiredHandler(() => {
      void clearUserData();
      setStatus('signedOut');
    });
  }, []);

  const signIn = useCallback(async (body: LoginRequest) => {
    const auth = await publicClient.auth.login(body);
    await clearUserData(); // a different account may have used this device
    await saveSession(auth);
    setStatus('signedIn');
  }, []);

  const signUp = useCallback(async (body: SignupRequest) => {
    const auth = await publicClient.auth.signup(body);
    await clearUserData();
    await saveSession(auth);
    setStatus('signedIn');
  }, []);

  const signOut = useCallback(async () => {
    const refreshToken = currentSession()?.refreshToken;
    // Best effort - revoke server-side, but never block sign-out on the network.
    if (refreshToken) publicClient.auth.logout({ refreshToken }).catch(() => {});
    await saveSession(null);
    await clearUserData();
    setStatus('signedOut');
  }, []);

  const value = useMemo(() => ({ status, signIn, signUp, signOut }), [status, signIn, signUp, signOut]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
