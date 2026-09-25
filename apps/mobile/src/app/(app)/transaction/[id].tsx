import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { TransactionResponse } from '@napayment/api-client';
import { BackHeader } from '@/components/back-header';
import { Button } from '@/components/button';
import { ReceiptEdge } from '@/components/receipt-edge';
import { Screen } from '@/components/screen';
import { StatusBadge } from '@/components/status-badge';
import { AppText } from '@/components/text';
import { useMe, useTransaction } from '@/hooks/queries';
import { errorMessage } from '@/lib/api';
import { formatDateTime, formatNaira } from '@/lib/format';
import { shareText } from '@/lib/share';
import { describeTransaction } from '@/lib/transactions';
import { colors, radius } from '@/theme';

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
  const holder = (me.data?.businessName ?? (me.data ? `${me.data.firstName} ${me.data.lastName}` : 'Napayment')).toUpperCase();

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

      <View style={styles.receiptWrap}>
        <View style={styles.receipt}>
          <AppText display size={15} align="center">
            {holder}
          </AppText>
          <AppText display size={12} color={colors.subtle} align="center" style={{ marginTop: 4 }}>
            {kind}
          </AppText>
          <View style={styles.rule} />
          <View style={{ gap: 8 }}>
            {rows.map(([label, value]) => (
              <View key={label} style={styles.line}>
                <AppText display size={13}>
                  {label}
                </AppText>
                <AppText display size={13} style={{ flexShrink: 1, textAlign: 'right' }}>
                  {value}
                </AppText>
              </View>
            ))}
          </View>
          <View style={styles.rule} />
          <View style={[styles.line, { alignItems: 'baseline' }]}>
            <AppText display size={14}>
              AMOUNT
            </AppText>
            <AppText display size={24}>
              {formatNaira(t.amount)}
            </AppText>
          </View>
          <AppText display size={10.5} color={colors.subtle} align="center" style={{ marginTop: 14, letterSpacing: 0.6 }} selectable>
            SESSION {t.sessionId}
          </AppText>
        </View>
        <ReceiptEdge />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 8 },
  receiptWrap: { marginHorizontal: 18, marginTop: 22 },
  receipt: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 24,
  },
  rule: { borderTopWidth: 1, borderStyle: 'dashed', borderColor: colors.receiptRule, marginVertical: 16 },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
});
