import { useMutationState } from '@tanstack/react-query';
import type { OutboxDisplay } from '@/lib/outbox';

export interface QueuedAction extends OutboxDisplay {
  id: number;
}

/** Outbox mutations waiting on the network (paused, not yet sent). */
export function useQueuedActions(): QueuedAction[] {
  return useMutationState({
    filters: { mutationKey: ['outbox'], predicate: (m) => m.state.isPaused },
    select: (m) => ({ id: m.mutationId, ...(m.state.variables as { display: OutboxDisplay }).display }),
  });
}
