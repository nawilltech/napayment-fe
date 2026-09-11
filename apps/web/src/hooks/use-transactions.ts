"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type {
  PageResponse,
  TransactionAnalyticsResponse,
  TransactionFilter,
  TransactionResponse,
} from "@napayment/api-client";
import { api } from "@/lib/api";

function buildQuery(filter: TransactionFilter, extra?: Record<string, number | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...filter, ...extra })) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useTransactions(filter: TransactionFilter, page: number, size = 20) {
  return useQuery({
    queryKey: ["transactions", filter, page, size],
    queryFn: () =>
      api.get<PageResponse<TransactionResponse>>(`/api/transactions${buildQuery(filter, { page, size })}`),
    placeholderData: keepPreviousData,
  });
}

export function useTransactionAnalytics(filter: TransactionFilter) {
  return useQuery({
    queryKey: ["transaction-analytics", filter],
    queryFn: () =>
      api.get<TransactionAnalyticsResponse>(`/api/transactions/analytics${buildQuery(filter)}`),
    placeholderData: keepPreviousData,
  });
}
