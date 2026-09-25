import { Alert, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import { router, type Href } from 'expo-router';
import { Card, Row } from '@/components/card';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { AppText } from '@/components/text';
import { useMe, useSettlementAccounts } from '@/hooks/queries';
import { useQueuedActions } from '@/hooks/use-outbox';
import { useSession } from '@/hooks/use-session';
import { initials } from '@/lib/format';
import { colors } from '@/theme';

type Item = { label: string; value?: string; href?: Href; onPress?: () => void; danger?: boolean };

function Group({ title, items }: { title: string; items: Item[] }) {
  return (
    <>
      <SectionHeader title={title} />
      <Card style={{ marginHorizontal: 16 }}>
        {items.map((it, i) => (
          <Row
            key={it.label}
            last={i === items.length - 1}
            style={{ minHeight: 48 }}
            onPress={it.onPress ?? (it.href ? () => router.push(it.href!) : undefined)}
            accessibilityLabel={it.value ? `${it.label}, ${it.value}` : it.label}
          >
            <AppText color={it.danger ? colors.danger : colors.ink}>{it.label}</AppText>
            <AppText size={12.5} color={colors.subtle}>
              {it.value ?? (it.href ? '›' : '')}
            </AppText>
          </Row>
        ))}
      </Card>
    </>
  );
}

export default function ProfileScreen() {
  const me = useMe();
  const settlement = useSettlementAccounts();
  const queued = useQueuedActions().length;
  const { signOut } = useSession();

  const user = me.data;
  const name = user ? (user.businessName ?? `${user.firstName} ${user.lastName}`) : '';
  const verified = user?.isVerified;
  const banks = settlement.data?.totalElements;

  function confirmSignOut() {
    Alert.alert(
      'Sign out?',
      queued > 0 ? `${queued} queued ${queued === 1 ? 'action' : 'actions'} will be discarded.` : undefined,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
      ],
    );
  }

  return (
    <Screen edges={['top']} refreshing={me.isRefetching} onRefresh={() => me.refetch()}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <AppText weight="semibold" size={18} color={colors.cream}>
            {initials(name)}
          </AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText weight="bold" size={18} numberOfLines={1}>
            {name || ' '}
          </AppText>
          <AppText size={12.5} color={colors.subtle} style={{ marginTop: 2 }} numberOfLines={1}>
            {user?.email ?? ' '}
          </AppText>
        </View>
      </View>

      {user && (
        <View style={[styles.kyc, { backgroundColor: verified ? colors.successSurface : colors.warningSurface }]}>
          <View style={{ flex: 1 }}>
            <AppText weight="semibold" size={13.5} color={verified ? colors.successInk : colors.warningInk}>
              {verified ? 'Account verified' : 'Verification pending'}
            </AppText>
            <AppText size={12} color={verified ? colors.successInk : colors.warningInk} style={{ marginTop: 2 }}>
              {user.businessName ? 'Business account' : 'Individual account'} · {user.phoneNo}
            </AppText>
          </View>
        </View>
      )}

      <Group
        title="Security"
        items={[
          { label: 'Transaction PIN', value: 'Set or change', href: '/security/pin' },
          { label: 'Change password', href: '/security/password' },
        ]}
      />
      <Group
        title="Account"
        items={[
          {
            label: 'Settlement bank',
            value: banks === undefined ? '—' : banks === 0 ? 'Not set' : `${banks} ${banks === 1 ? 'account' : 'accounts'}`,
            href: '/withdraw',
          },
          { label: 'Waiting to send', value: queued ? `${queued} queued` : 'None', href: '/queue' },
          { label: 'Sign out', onPress: confirmSignOut, danger: true },
        ]}
      />

      <AppText eyebrow size={10.5} color={colors.faint} align="center" style={{ marginTop: 28 }}>
        A Nawill product · v{Constants.expoConfig?.version ?? '0.1.0'}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  kyc: { marginHorizontal: 16, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' },
});
