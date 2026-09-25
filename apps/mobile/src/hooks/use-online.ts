import { useSyncExternalStore } from 'react';
import { onlineManager } from '@tanstack/react-query';

/** Same signal the query client uses to pause/replay, so UI and outbox never disagree. */
export function useOnline() {
  return useSyncExternalStore(
    (cb) => onlineManager.subscribe(cb),
    () => onlineManager.isOnline(),
    () => true,
  );
}
