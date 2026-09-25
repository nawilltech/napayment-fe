import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ChangePasswordRequest,
  CreateDynamicAccountRequest,
  DynamicVirtualAccountResponse,
  SetTransactionPinRequest,
  TransactionFilter,
  TransferRequest,
} from '@napayment/api-client';
import { api } from '@/lib/api';
import { keys } from '@/lib/keys';
import { newIdempotencyKey } from '@/lib/outbox';

const PAGE_SIZE = 20;

export function useMe() {
  return useQuery({ queryKey: keys.me, queryFn: () => api((c) => c.users.me()) });
}

/** The wallet: first virtual account. Undefined data = none yet or no permission. */
export function useWallet() {
  return useQuery({
    queryKey: keys.virtualAccounts,
    queryFn: () => api((c) => c.virtualAccounts.listMine({ size: 5 })),
    select: (page) => page.content[0] ?? null,
  });
}

export function useTransactionFeed(filter: TransactionFilter) {
  return useInfiniteQuery({
    queryKey: keys.transactionList(filter),
    queryFn: ({ pageParam }) => api((c) => c.transactions.list(filter, { page: pageParam, size: PAGE_SIZE })),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.page + 1 < last.totalPages ? last.page + 1 : undefined),
  });
}

export function useRecentTransactions(size = 4) {
  return useQuery({
    queryKey: [...keys.transactionList({}), 'recent', size],
    queryFn: () => api((c) => c.transactions.list({}, { page: 0, size })),
  });
}

export function useTransaction(id: string) {
  return useQuery({ queryKey: keys.transaction(id), queryFn: () => api((c) => c.transactions.get(id)) });
}

export function useAnalytics(filter: TransactionFilter) {
  return useQuery({ queryKey: keys.analytics(filter), queryFn: () => api((c) => c.transactions.analytics(filter)) });
}

export function usePaymentLinks() {
  return useQuery({ queryKey: keys.paymentLinks, queryFn: () => api((c) => c.paymentLinks.list({ size: 50 })) });
}

export function useRevokePaymentLink() {
  const qc = useQueryClient();
  return useMutation({
    networkMode: 'always',
    mutationFn: (id: string) => api((c) => c.paymentLinks.revoke(id)),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.paymentLinks }),
  });
}

/** Online-only (see outbox.ts): no idempotency key on this endpoint, so never replayed. */
export function useCreateDynamicAccount() {
  const qc = useQueryClient();
  return useMutation({
    networkMode: 'always',
    mutationFn: (body: CreateDynamicAccountRequest) => api((c) => c.dynamicAccounts.create(body)),
    onSuccess: (account) => {
      qc.setQueryData(keys.dynamicAccount(account.id), account);
      qc.invalidateQueries({ queryKey: keys.dynamicAccounts });
    },
  });
}

/**
 * No GET-by-id exists for one-time accounts, so the waiting screen polls the
 * list and picks its account out - every 5s while still ACTIVE.
 */
export function useDynamicAccount(id: string) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: keys.dynamicAccount(id),
    queryFn: async () => {
      const page = await api((c) => c.dynamicAccounts.list({ size: 50 }));
      const found = page.content.find((a) => a.id === id);
      return found ?? qc.getQueryData<DynamicVirtualAccountResponse>(keys.dynamicAccount(id)) ?? null;
    },
    refetchInterval: (query) => (query.state.data?.status === 'ACTIVE' ? 5000 : false),
  });
}

export function useSettlementAccounts() {
  return useQuery({
    queryKey: keys.settlementAccounts,
    queryFn: () => api((c) => c.settlementAccounts.list({ size: 20 })),
  });
}

export function useBankAccounts() {
  return useQuery({ queryKey: keys.bankAccounts, queryFn: () => api((c) => c.bankAccounts.list({ size: 50 })) });
}

export function useBanks() {
  return useQuery({
    queryKey: keys.banks,
    queryFn: () => api((c) => c.referenceData.listBanks({ size: 500 })),
    staleTime: 24 * 60 * 60 * 1000,
    select: (page) => new Map(page.content.map((b) => [b.id, b.name])),
  });
}

export function useResolveRecipient() {
  return useMutation({
    networkMode: 'always',
    mutationFn: (identifier: string) => api((c) => c.transfers.resolve(identifier)),
  });
}

/** Online-only: carries the PIN, which must never be persisted to the outbox. */
export function useTransfer() {
  const qc = useQueryClient();
  return useMutation({
    networkMode: 'always',
    mutationFn: ({ body, idempotencyKey }: { body: TransferRequest; idempotencyKey: string }) =>
      api((c) => c.transfers.create(body, idempotencyKey)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.virtualAccounts });
      qc.invalidateQueries({ queryKey: keys.transactions });
    },
  });
}

export function useSetTransactionPin() {
  return useMutation({
    networkMode: 'always',
    mutationFn: (body: SetTransactionPinRequest) => api((c) => c.auth.setTransactionPin(body)),
  });
}

export function useChangePassword() {
  return useMutation({
    networkMode: 'always',
    mutationFn: (body: ChangePasswordRequest) => api((c) => c.auth.changePassword(body)),
  });
}

export { newIdempotencyKey };
