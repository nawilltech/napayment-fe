import type { TransactionFilter } from '@napayment/api-client';

/** Query keys in one place so invalidation can't drift from reads. */
export const keys = {
  me: ['me'] as const,
  virtualAccounts: ['virtual-accounts'] as const,
  transactions: ['transactions'] as const,
  transactionList: (filter: TransactionFilter) => ['transactions', 'list', filter] as const,
  transaction: (id: string) => ['transactions', 'detail', id] as const,
  analytics: (filter: TransactionFilter) => ['transactions', 'analytics', filter] as const,
  paymentLinks: ['payment-links'] as const,
  dynamicAccounts: ['dynamic-accounts'] as const,
  dynamicAccount: (id: string) => ['dynamic-accounts', 'detail', id] as const,
  settlementAccounts: ['settlement-accounts'] as const,
  bankAccounts: ['bank-accounts'] as const,
  banks: ['banks'] as const,
};
