import type { TransactionResponse } from '@napayment/api-client';
import { formatNaira } from './format';

/**
 * TransactionResponse carries no payer/merchant name, so rows are titled by
 * what happened. Transfer legs share a transferGroupId (one DEBIT + one CREDIT).
 */
export function describeTransaction(txn: TransactionResponse) {
  const credit = txn.transactionType === 'CREDIT';
  const title = txn.transferGroupId
    ? credit
      ? 'Transfer received'
      : 'Transfer sent'
    : credit
      ? 'Payment received'
      : 'Withdrawal';
  const method = txn.transferGroupId ? 'Transfer' : credit ? 'Collection' : 'Payout';
  const signedAmount = `${credit ? '+' : '−'}${formatNaira(txn.amount, { decimals: false })}`;
  return { credit, title, method, signedAmount };
}
