"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TransferInput } from "@napayment/schemas";
import type { TransferResolveResponse, TransferResponse } from "@napayment/api-client";
import { api } from "@/lib/api";

/** On-demand lookup (not auto-fetched) - triggered once the sender has typed a recipient identifier. */
export function useResolveRecipient() {
  return useMutation({
    mutationFn: (identifier: string) =>
      api.get<TransferResolveResponse>(`/api/transfers/resolve?identifier=${encodeURIComponent(identifier)}`),
  });
}

export function useTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, idempotencyKey }: { input: TransferInput; idempotencyKey: string }) =>
      api.post<TransferResponse>("/api/transfers", input, { "Idempotency-Key": idempotencyKey }),
    onSuccess: () => {
      // The sender's transaction history changed; the response's own
      // senderNewBalance is what the confirmation screen shows directly, so
      // there's no separate balance query to invalidate here today (the
      // dashboard home balance is server-rendered per request, not cached
      // client-side).
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
