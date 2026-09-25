import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { BackHeader } from '@/components/back-header';
import { Button } from '@/components/button';
import { useCopy } from '@/components/copy';
import { ReceiptEdge } from '@/components/receipt-edge';
import { Screen } from '@/components/screen';
import { AppText } from '@/components/text';
import { useDynamicAccount, useMe } from '@/hooks/queries';
import { useNow } from '@/hooks/use-now';
import { countdown, formatNaira, groupAccountNumber } from '@/lib/format';
import { shareSms } from '@/lib/share';
import { colors, radius } from '@/theme';

export default function OneTimeAccountScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const account = useDynamicAccount(id);
  const me = useMe();
  const { copied, copy } = useCopy();

  const data = account.data;
  const active = data?.status === 'ACTIVE';
  const now = useNow(active);
  const expired = data?.status === 'EXPIRED' || (active && new Date(data.expiresAt).getTime() <= now);
  const paid = data?.status === 'PAID';
  const holder = me.data?.businessName ?? (me.data ? `${me.data.firstName} ${me.data.lastName}` : '');

  const shareMessage = data
    ? `Pay ${data.expectedAmount ? formatNaira(data.expectedAmount) : ''} to ${data.accountNumber}${holder ? ` (Napayment / ${holder})` : ''}. Valid for 30 minutes.`
    : '';

  return (
    <Screen
      tone="brand"
      footer={
        data && !paid && !expired ? (
          <View style={styles.footerRow}>
            <Button title={copied ? 'Copied' : 'Copy number'} variant="cream" onPress={() => copy(data.accountNumber)} style={{ flex: 1 }} />
            <Button title="Share by SMS" variant="onBrand" onPress={() => shareSms(shareMessage)} style={{ flex: 1 }} />
          </View>
        ) : (
          <Button title="Done" variant="cream" onPress={() => router.navigate('/')} />
        )
      }
    >
      <BackHeader onBrand />
      <View style={styles.head}>
        <AppText size={14} color={colors.brandSoft} align="center">
          {paid ? 'Payment received' : expired ? 'This account has expired' : 'Ask the payer to transfer'}
        </AppText>
        <AppText mono weight="semibold" size={34} color={colors.cream} align="center" style={{ marginTop: 6 }}>
          {data?.expectedAmount ? formatNaira(data.expectedAmount) : 'Any amount'}
        </AppText>
      </View>

      {data && (
        <View style={styles.receiptWrap}>
          <View style={styles.receipt}>
            <View>
              <AppText eyebrow size={10.5}>
                Account number
              </AppText>
              <AppText
                mono
                weight="semibold"
                size={28}
                style={[{ marginTop: 4, letterSpacing: 1 }, (expired || paid) && { color: colors.faint, textDecorationLine: expired ? 'line-through' : 'none' }]}
                accessibilityLabel={`Account number ${data.accountNumber.split('').join(' ')}`}
              >
                {groupAccountNumber(data.accountNumber)}
              </AppText>
            </View>
            <Line label="Account name" value={holder ? `Napayment / ${holder}` : 'Napayment'} />
            {data.reference && <Line label="Reference" value={data.reference} />}
            {paid ? (
              <View style={[styles.state, { backgroundColor: colors.successSurface }]}>
                <AppText size={12.5} color={colors.successInk}>
                  Status
                </AppText>
                <AppText mono weight="semibold" size={16} color={colors.successInk}>
                  PAID
                </AppText>
              </View>
            ) : (
              <View style={[styles.state, { backgroundColor: expired ? colors.lineSoft : colors.warningSurface }]}>
                <AppText size={12.5} color={expired ? colors.subtle : colors.warningInk}>
                  {expired ? 'Expired' : 'Expires in'}
                </AppText>
                <AppText
                  mono
                  weight="semibold"
                  size={16}
                  color={expired ? colors.subtle : colors.warningInk}
                  accessibilityLiveRegion="none"
                >
                  {expired ? '00:00' : countdown(data.expiresAt, now)}
                </AppText>
              </View>
            )}
          </View>
          <ReceiptEdge />
        </View>
      )}

      {!data && account.isLoading && (
        <AppText color={colors.brandSoft} align="center" style={{ marginTop: 40 }}>
          Loading…
        </AppText>
      )}

      {data && active && !expired && (
        <View style={styles.waiting}>
          <View style={styles.pulse} />
          <AppText size={13} color={colors.brandSoft} style={{ flexShrink: 1 }}>
            Waiting for transfer. This screen updates when it lands.
          </AppText>
        </View>
      )}
    </Screen>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <AppText size={13.5} color={colors.subtle} numberOfLines={1} style={{ flexShrink: 0 }}>
        {label}
      </AppText>
      <AppText size={13.5} weight="semibold" numberOfLines={1} style={{ flexShrink: 1 }}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 22, paddingTop: 8 },
  receiptWrap: { marginHorizontal: 18, marginTop: 22 },
  receipt: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20,
    gap: 14,
  },
  state: { borderRadius: radius.lg, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  waiting: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 22, paddingTop: 16 },
  pulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.cream, opacity: 0.9 },
  footerRow: { flexDirection: 'row', gap: 10 },
});
