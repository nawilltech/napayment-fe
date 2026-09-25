import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient, focusManager, onlineManager } from '@tanstack/react-query';
import { ApiError } from '@napayment/api-client';

/**
 * Offline resilience per doc F5:
 * 1. Read cache - queries persist to AsyncStorage, so the last balance and
 *    history show immediately on open, even with no network (marked stale).
 * 2. Write outbox - mutations registered in outbox.ts pause while offline,
 *    persist with their idempotency key, and replay on reconnect.
 */

// Connectivity, not reachability: isInternetReachable can stay false after a
// reconnect until something re-probes, which stalled the outbox replay.
// "Connected but no internet" is covered by outbox retries (outbox.ts).
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => {
    setOnline(Boolean(state.isConnected));
  }),
);

// Back in the foreground: re-check connectivity (NetInfo can be stale after
// the OS suspended the app) and refetch stale queries. Reconnecting also
// makes the onlineManager resume anything paused in the outbox.
AppState.addEventListener('change', (status) => {
  if (Platform.OS === 'web') return;
  focusManager.setFocused(status === 'active');
  if (status === 'active') void NetInfo.refresh();
});

const DAY = 24 * 60 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: DAY, // must be >= persister maxAge or cached reads get dropped before they're saved
      retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 2,
    },
  },
});

export const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'napayment.cache',
  throttleTime: 1000,
});

export const PERSIST_MAX_AGE = DAY;
