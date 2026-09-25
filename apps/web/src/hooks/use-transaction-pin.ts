"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { SetTransactionPinInput } from "@napayment/schemas";
import { api } from "@/lib/api";

export function useSetTransactionPin() {
  return useMutation({
    mutationFn: (input: SetTransactionPinInput) =>
      api.post<{ message: string }>("/api/auth/transaction-pin", input),
    onSuccess: () => toast.success("Transaction PIN saved"),
    onError: (error: Error) => toast.error(error.message),
  });
}
