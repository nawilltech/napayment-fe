import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { ApiError, createBackendClient, type AuthResponse, type BackendClient } from '@napayment/api-client';

/**
 * Direct-to-backend client for the Wallet App (doc F4). Tokens live in
 * expo-secure-store (Keychain/Keystore, ADR-FE-7), mirrored in memory so
 * every request doesn't hit native storage.
 */

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
const TOKENS_KEY = 'napayment.session';

export interface Session {
  accessToken: string;
  refreshToken: string;
  userId: string;
}

let session: Session | null = null;
let refreshing: Promise<Session | null> | null = null;
let onExpired: (() => void) | null = null;

export const publicClient = createBackendClient({ baseUrl: BASE_URL });

// expo-secure-store has no web implementation. The web build is a dev
// preview only, so there the session stays in memory (a reload signs out)
// rather than falling back to unencrypted browser storage.
const persistTokens = Platform.OS !== 'web';

export async function loadSession(): Promise<Session | null> {
  if (!persistTokens) return session;
  const raw = await SecureStore.getItemAsync(TOKENS_KEY);
  session = raw ? (JSON.parse(raw) as Session) : null;
  return session;
}

export async function saveSession(auth: AuthResponse | null) {
  session = auth ? { accessToken: auth.accessToken, refreshToken: auth.refreshToken, userId: auth.userId } : null;
  if (!persistTokens) return;
  if (session) await SecureStore.setItemAsync(TOKENS_KEY, JSON.stringify(session));
  else await SecureStore.deleteItemAsync(TOKENS_KEY);
}

export function currentSession() {
  return session;
}

/** Called once by the session provider so a dead refresh token routes back to sign-in. */
export function setSessionExpiredHandler(handler: () => void) {
  onExpired = handler;
}

/**
 * Refresh tokens are single-use (NFR-7): concurrent 401s must share one
 * refresh call, or the second would present an already-rotated token.
 */
async function refreshSession(): Promise<Session | null> {
  if (!session) return null;
  refreshing ??= (async () => {
    try {
      const auth = await publicClient.auth.refresh({ refreshToken: session!.refreshToken });
      await saveSession(auth);
      return session;
    } catch (error) {
      // Only a rejected token ends the session - a network failure keeps it for later.
      if (error instanceof ApiError) {
        await saveSession(null);
        onExpired?.();
      }
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

/** Run a call as the signed-in user, refreshing the access token once on a 401. */
export async function api<T>(call: (client: BackendClient) => Promise<T>): Promise<T> {
  const attempt = () => call(createBackendClient({ baseUrl: BASE_URL, accessToken: session?.accessToken }));
  try {
    return await attempt();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401 && session) {
      if (await refreshSession()) return attempt();
    }
    throw error;
  }
}

/** A human sentence for any thrown error - backend message, else a network hint. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.details[0] ?? error.message;
  if (error instanceof TypeError) return "Can't reach Napayment. Check your connection and try again.";
  return error instanceof Error ? error.message : 'Something went wrong.';
}

export function isForbidden(error: unknown) {
  return error instanceof ApiError && error.status === 403;
}
