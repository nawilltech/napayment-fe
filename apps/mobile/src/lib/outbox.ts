import * as Crypto from 'expo-crypto';
import type { CreatePaymentLinkRequest, PaymentLinkResponse, SettleRequest, SettlementResponse } from '@napayment/api-client';
import { ApiError } from '@napayment/api-client';
import { api } from './api';
import { queryClient } from './query';
import { keys } from './keys';

/**
 * Write outbox (doc F5). Only mutations that are safe to replay live here:
 * each carries an Idempotency-Key generated when the user taps, so a replay
 * after reconnect is a no-op server-side if the first attempt landed.
 *
 * Deliberately NOT queued: transfers (need the PIN, which is never written
 * to disk) and one-time accounts (no idempotency key - a replay could mint
 * a second account). Those require a live connection.
 *
 * mutationFns are registered by key at module load so mutations rehydrated
 * from AsyncStorage after an app restart can still run.
 */

export interface OutboxDisplay {
  title: string;
  detail: string;
  amount: string | null; // kobo
  createdAt: number;
}

export interface CreateLinkVars {
  body: CreatePaymentLinkRequest;
  idempotencyKey: string;
  display: OutboxDisplay;
}

export interface SettleVars {
  body: SettleRequest;
  idempotencyKey: string;
  display: OutboxDisplay;
}

export const outboxKeys = {
  createLink: ['outbox', 'payment-link'] as const,
  settle: ['outbox', 'settlement'] as const,
};

export const newIdempotencyKey = () => Crypto.randomUUID();

/**
 * Network failures (connected, but the request never landed) retry with
 * backoff instead of dropping the queued action; the idempotency key makes
 * each retry safe. A backend rejection (ApiError) is final.
 */
const replay = {
  retry: (count: number, error: unknown) => !(error instanceof ApiError) && count < 5,
  retryDelay: (attempt: number) => Math.min(2000 * 2 ** attempt, 30_000),
};

queryClient.setMutationDefaults(outboxKeys.createLink, {
  ...replay,
  mutationFn: ({ body, idempotencyKey }: CreateLinkVars): Promise<PaymentLinkResponse> =>
    api((c) => c.paymentLinks.create(body, idempotencyKey)),
  onSettled: () => queryClient.invalidateQueries({ queryKey: keys.paymentLinks }),
});

queryClient.setMutationDefaults(outboxKeys.settle, {
  ...replay,
  mutationFn: ({ body, idempotencyKey }: SettleVars): Promise<SettlementResponse[]> =>
    api((c) => c.settlements.trigger(body, idempotencyKey)),
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: keys.virtualAccounts });
    queryClient.invalidateQueries({ queryKey: keys.transactions });
  },
});
