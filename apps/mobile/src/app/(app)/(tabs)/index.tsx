import { Pressable, StyleSheet, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Card } from '@/components/card';
import { useCopy } from '@/components/copy';
import { Empty } from '@/components/empty';
import { OfflineBanner } from '@/components/offline-banner';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { AppText } from '@/components/text';
import { TransactionRow } from '@/components/transaction-row';
import { useMe, useRecentTransactions, useWallet } from '@/hooks/queries';
import { isForbidden } from '@/lib/api';
import { formatNaira, greeting, groupAccountNumber, initials } from '@/lib/format';
import { colors, radius } from '@/theme';

const ACTIONS: { label: string; glyph: string; href: Href; primary?: boolean }[] = [
  { label: 'Collect', glyph: '+', href: '/collect/new', primary: true },
  { label: 'Send', glyph: '↗', href: '/send' },
  { label: 'Withdraw', glyph: '↓', href: '/withdraw' },
];

export default function HomeScreen() {
  const me = useMe();
  const wallet = useWallet();
  const recent = useRecentTransactions(4);
  const { copied, copy } = useCopy();

  const name = me.data ? (me.data.businessName ?? `${me.data.firstName} ${me.data.lastName}`) : '';
  const account = wallet.data;
  const refreshing = wallet.isRefetching || recent.isRefetching;

  return (
    <Screen
      edges={['top']}
      refreshing={refreshing}
      onRefresh={() => {
        me.refetch();
        wallet.refetch();
        recent.refetch();
      }}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <AppText size={13} color={colors.subtle}>
            {greeting()}
          </AppText>
          <AppText weight="bold" size={19} numberOfLines={1}>
            {name || ' '}
          </AppText>
        </View>
        <Pressable
          onPress={() => router.navigate('/profile')}
          accessibilityRole="button"
          accessibilityLabel="Profile"
          style={styles.avatar}
        >
          <AppText weight="semibold">{initials(name)}</AppText>
        </Pressable>
      </View>

      <OfflineBanner since={wallet.dataUpdatedAt || undefined} />

      <View style={styles.balance}>
        <AppText eyebrow color={colors.brandSoft}>
          Wallet balance
        </AppText>
        <AppText mono weight="semibold" size={30} color={colors.cream} style={{ marginTop: 6 }} accessibilityLabel={`Balance ${account ? formatNaira(account.balance) : 'unavailable'}`}>
          {account ? formatNaira(account.balance) : wallet.isLoading ? ' ' : '—'}
        </AppText>
        <View style={styles.balanceFoot}>
          <View style={{ flex: 1 }}>
            <AppText size={11} color={colors.brandSoft}>
              Virtual account · {account?.currency ?? 'NGN'}
            </AppText>
            <AppText mono size={16} color={colors.cream} style={{ marginTop: 2, letterSpacing: 1 }}>
              {account ? groupAccountNumber(account.accountNumber) : isForbidden(wallet.error) ? 'Not available for your role' : '—'}
            </AppText>
          </View>
          {account && (
            <Pressable
              onPress={() => copy(account.accountNumber)}
              accessibilityRole="button"
              accessibilityLabel="Copy account number"
              style={({ pressed }) => [styles.copy, pressed && { opacity: 0.85 }]}
            >
              <AppText size={12.5} weight="semibold" color={colors.brand}>
                {copied ? 'Copied' : 'Copy'}
              </AppText>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        {ACTIONS.map((a) => (
          <Pressable
            key={a.label}
            onPress={() => router.push(a.href)}
            accessibilityRole="button"
            accessibilityLabel={a.label}
            style={({ pressed }) => [styles.action, a.primary ? styles.actionPrimary : styles.actionPlain, pressed && { opacity: 0.85 }]}
          >
            <AppText size={18} color={a.primary ? colors.cream : colors.ink} style={{ lineHeight: 20 }}>
              {a.glyph}
            </AppText>
            <AppText size={13} weight="semibold" color={a.primary ? colors.cream : colors.ink}>
              {a.label}
            </AppText>
          </Pressable>
        ))}
      </View>

      <SectionHeader title="Recent" action="See all" href="/activity" />
      <Card style={styles.list}>
        {recent.data?.content.map((txn, i, all) => (
          <TransactionRow key={txn.id} txn={txn} last={i === all.length - 1} />
        ))}
        {recent.data?.content.length === 0 && <Empty title="No payments yet" body="They'll show here as soon as one lands." />}
        {recent.isError && !recent.data && (
          <Empty title={isForbidden(recent.error) ? "Your role can't view transactions" : "Couldn't load activity"} body={isForbidden(recent.error) ? undefined : 'Pull down to try again.'} />
        )}
        {recent.isLoading && <Empty title="Loading…" />}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.sand, alignItems: 'center', justifyContent: 'center' },
  balance: { marginHorizontal: 16, backgroundColor: colors.brand, borderRadius: 16, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 16 },
  balanceFoot: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(244,238,221,0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  copy: { backgroundColor: colors.cream, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 8 },
  actions: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginTop: 12 },
  action: { flex: 1, height: 64, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center', gap: 4 },
  actionPrimary: { backgroundColor: colors.ink },
  actionPlain: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  list: { marginHorizontal: 16 },
});
