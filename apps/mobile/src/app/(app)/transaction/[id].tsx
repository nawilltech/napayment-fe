import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { TransactionResponse } from '@napayment/api-client';
import { BackHeader } from '@/components/back-header';
import { Button } from '@/components/button';
import { Receipt, ReceiptLine, ReceiptRule } from '@/components/receipt';
import { Screen } from '@/components/screen';
import { StatusBadge } from '@/components/status-badge';
import { AppText } from '@/components/text';
import { useMe, useTransaction } from '@/hooks/queries';
import { errorMessage } from '@/lib/api';
import { describeTransaction, displayName, formatDateTime, formatNaira } from '@napayment/format';
import { shareText } from '@/lib/share';
import { colors } from '@/theme';

function headline(txn: TransactionResponse) {
  const { credit } = describeTransaction(txn);
  switch (txn.transactionStatus) {
    case 'PAID':
      return { kind: 'success' as const, title: credit ? 'Payment received' : 'Money sent' };
    case 'FAILED':
      return { kind: 'failed' as const, title: credit ? 'Payment failed' : 'Transfer failed' };
    case 'ON_HOLD':
      return { kind: 'held' as const, title: 'On hold for review' };
    default:
      // Never a green check before the money has actually settled (doc F5).
      return { kind: 'pending' as const, title: credit ? 'Payment pending' : 'Sending' };
  }
}

export default function ReceiptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const txn = useTransaction(id);
  const me = useMe();
  const holder = (me.data ? displayName(me.data) : 'Napayment').toUpperCase();

  if (!txn.data) {
    return (
      <Screen tone="brand" footer={<Button title="Done" variant="onBrand" onPress={() => router.back()} />}>
        <BackHeader onBrand />
        <View style={{ alignItems: 'center', marginTop: 60 }}>
          {txn.isLoading ? (
            <ActivityIndicator color={colors.cream} />
          ) : (
            <AppText color={colors.brandSoft} align="center">
              {errorMessage(txn.error)}
            </AppText>
          )}
        </View>
      </Screen>
    );
  }

  const t = txn.data;
  const { title: kind, method } = describeTransaction(t);
  const head = headline(t);
  const rows: [string, string][] = [
    ['Method', method],
    ['Date', formatDateTime(t.createdAt)],
    ['Status', t.transactionStatus.replaceAll('_', ' ')],
    ['Charge', formatNaira(t.charge)],
  ];

  const receiptText = [
    `napayment receipt`,
    holder,
    kind,
    ...rows.map(([k, v]) => `${k}: ${v}`),
    `Amount: ${formatNaira(t.amount)}`,
    `Session: ${t.sessionId}`,
  ].join('\n');

  return (
    <Screen
      tone="brand"
      footer={
        <>
          <Button title="Share receipt" variant="cream" onPress={() => shareText(receiptText)} />
          <Button title="Done" variant="onBrand" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        </>
      }
    >
      <BackHeader onBrand />
      <View style={styles.head}>
        <StatusBadge kind={head.kind} />
        <AppText weight="semibold" size={20} color={colors.cream} style={{ marginTop: 12 }} accessibilityRole="header">
          {head.title}
        </AppText>
      </View>

      <Receipt gap={8}>
        <AppText display size={15} align="center">
          {holder}
        </AppText>
        <AppText display size={12} color={colors.subtle} align="center">
          {kind}
        </AppText>
        <ReceiptRule />
        {rows.map(([label, value]) => (
          <ReceiptLine key={label} label={label} value={value} typewriter />
        ))}
        <ReceiptRule />
        <ReceiptLine label="Amount" value={formatNaira(t.amount)} typewriter total />
        <AppText display size={10.5} color={colors.subtle} align="center" style={{ marginTop: 8, letterSpacing: 0.6 }} selectable>
          SESSION {t.sessionId}
        </AppText>
      </Receipt>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 8 },
});
