import { View } from 'react-native';
import { router } from 'expo-router';
import type { TransactionResponse } from '@napayment/api-client';
import { formatTime } from '@/lib/format';
import { describeTransaction } from '@/lib/transactions';
import { colors } from '@/theme';
import { Row } from './card';
import { StatusTag } from './status-tag';
import { AppText } from './text';

export function TransactionRow({
  txn,
  last,
  tagged,
}: {
  txn: TransactionResponse;
  last?: boolean;
  /** Status as a tinted tag (Activity) rather than plain mono text (Home). */
  tagged?: boolean;
}) {
  const { title, method, signedAmount } = describeTransaction(txn);
  return (
    <Row
      last={last}
      onPress={() => router.push({ pathname: '/transaction/[id]', params: { id: txn.id } })}
      accessibilityLabel={`${title}, ${signedAmount}, ${txn.transactionStatus}`}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText weight="semibold" numberOfLines={1}>
          {title}
        </AppText>
        <AppText size={11.5} color={colors.subtle} numberOfLines={1} style={{ marginTop: 2 }}>
          {method} · {formatTime(txn.createdAt)} · ···{txn.sessionId.slice(-6)}
        </AppText>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 3 }}>
        <AppText mono weight="medium" size={13.5}>
          {signedAmount}
        </AppText>
        <StatusTag status={txn.transactionStatus} plain={!tagged} />
      </View>
    </Row>
  );
}
