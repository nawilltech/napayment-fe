import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import type { PaymentLinkResponse } from '@napayment/api-client';
import { Card, Row } from '@/components/card';
import { useCopy } from '@/components/copy';
import { Empty } from '@/components/empty';
import { OfflineBanner } from '@/components/offline-banner';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { StatusTag } from '@/components/status-tag';
import { AppText } from '@/components/text';
import { usePaymentLinks, useRevokePaymentLink } from '@/hooks/queries';
import { useQueuedActions } from '@/hooks/use-outbox';
import { errorMessage, isForbidden } from '@/lib/api';
import { formatDate, formatNaira } from '@/lib/format';
import { linkLabel, linkMessage, linkUrl, shareSms, shareText, shareWhatsApp } from '@/lib/share';
import { colors, radius } from '@/theme';

const linkKind = (l: PaymentLinkResponse) =>
  `${l.linkType === 'PERMANENT' ? 'Permanent' : 'Temporary'} · ${l.singleUse ? 'Single use' : 'Multi-use'}`;

const linkTitle = (l: PaymentLinkResponse) =>
  l.amount ? `${formatNaira(l.amount, { decimals: false })} link` : 'Any-amount link';

function linkMeta(l: PaymentLinkResponse) {
  if (l.linkStatus === 'EXPIRED' && l.expiresAt) return `Expired ${formatDate(l.expiresAt)}`;
  if (l.linkStatus === 'ACTIVE' && l.expiresAt) return `${linkLabel(l)} · until ${formatDate(l.expiresAt)}`;
  return `${linkLabel(l)} · ${linkKind(l)}`;
}

export default function CollectScreen() {
  const links = usePaymentLinks();
  const revoke = useRevokePaymentLink();
  const queued = useQueuedActions().filter((q) => q.title.startsWith('Payment link'));
  const { copied, copy } = useCopy();

  const all = links.data?.content ?? [];
  const featured = all.find((l) => l.linkStatus === 'ACTIVE');

  function openActions(link: PaymentLinkResponse) {
    const message = linkMessage(link);
    Alert.alert(linkTitle(link), linkLabel(link), [
      { text: 'Copy link', onPress: () => copy(linkUrl(link)) },
      { text: 'Share', onPress: () => shareText(message) },
      ...(link.linkStatus === 'ACTIVE'
        ? [
            {
              text: 'Revoke',
              style: 'destructive' as const,
              onPress: () =>
                revoke.mutate(link.id, { onError: (e) => Alert.alert("Couldn't revoke link", errorMessage(e)) }),
            },
          ]
        : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  }

  return (
    <Screen edges={['top']} refreshing={links.isRefetching} onRefresh={() => links.refetch()}>
      <View style={styles.header}>
        <AppText weight="bold" size={22}>
          Payment links
        </AppText>
        <Pressable
          onPress={() => router.push({ pathname: '/collect/new', params: { method: 'link' } })}
          accessibilityRole="button"
          accessibilityLabel="New payment link"
          style={({ pressed }) => [styles.newBtn, pressed && { opacity: 0.85 }]}
        >
          <AppText size={13} weight="semibold" color={colors.cream}>
            + New
          </AppText>
        </Pressable>
      </View>

      <OfflineBanner since={links.dataUpdatedAt || undefined} />

      {featured && (
        <View style={styles.featured}>
          <View style={styles.rowBetween}>
            <AppText eyebrow size={10.5} color={colors.inkSubtle}>
              {linkKind(featured)}
            </AppText>
            <View style={styles.activeTag}>
              <AppText mono size={10.5} color={colors.white}>
                ACTIVE
              </AppText>
            </View>
          </View>
          <AppText weight="semibold" size={17} color={colors.cream} style={{ marginTop: 10 }}>
            {featured.amount ? 'Fixed amount' : 'Payer enters amount'}
          </AppText>
          <AppText mono weight="semibold" size={24} color={colors.cream} style={{ marginTop: 4 }}>
            {featured.amount ? formatNaira(featured.amount, { decimals: false }) : 'Any amount'}
          </AppText>
          <Pressable
            onPress={() => copy(linkUrl(featured))}
            accessibilityRole="button"
            accessibilityLabel="Copy link"
            style={styles.linkBox}
          >
            <AppText mono size={13} color={colors.cream} numberOfLines={1} style={{ flex: 1 }}>
              {linkLabel(featured)}
            </AppText>
            <AppText size={12.5} weight="semibold" color={colors.inkSubtle}>
              {copied ? 'Copied' : 'Copy'}
            </AppText>
          </Pressable>
          <View style={styles.shareRow}>
            <Pressable onPress={() => shareWhatsApp(linkMessage(featured))} accessibilityRole="button" style={[styles.shareBtn, styles.shareCream]}>
              <AppText size={13.5} weight="semibold">
                WhatsApp
              </AppText>
            </Pressable>
            <Pressable onPress={() => shareSms(linkMessage(featured))} accessibilityRole="button" style={[styles.shareBtn, styles.shareOutline]}>
              <AppText size={13.5} weight="semibold" color={colors.cream}>
                SMS
              </AppText>
            </Pressable>
          </View>
        </View>
      )}

      <Pressable
        onPress={() => router.push({ pathname: '/collect/new', params: { method: 'account' } })}
        accessibilityRole="button"
        style={({ pressed }) => [styles.oneTime, pressed && { backgroundColor: colors.paper }]}
      >
        <View style={{ flex: 1 }}>
          <AppText weight="semibold">One-time account number</AppText>
          <AppText size={12} color={colors.subtle} style={{ marginTop: 2 }}>
            For walk-in payments. Expires in 30 minutes.
          </AppText>
        </View>
        <AppText size={16} color={colors.brand}>
          →
        </AppText>
      </Pressable>

      <SectionHeader title="All links" />
      <Card style={styles.list}>
        {queued.map((q) => (
          <Row key={`q-${q.id}`}>
            <View style={{ flex: 1 }}>
              <AppText weight="semibold">{q.title}</AppText>
              <AppText size={11} mono color={colors.subtle} style={{ marginTop: 2 }}>
                {q.detail}
              </AppText>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 2 }}>
              <AppText mono size={13.5}>
                {q.amount ? formatNaira(q.amount, { decimals: false }) : 'Any amount'}
              </AppText>
              <StatusTag status="QUEUED" plain />
            </View>
          </Row>
        ))}
        {all.map((link, i) => (
          <Row key={link.id} last={i === all.length - 1} onPress={() => openActions(link)} accessibilityLabel={`${linkTitle(link)}, ${link.linkStatus}`}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText weight="semibold" numberOfLines={1}>
                {linkTitle(link)}
              </AppText>
              <AppText size={11} mono color={colors.subtle} numberOfLines={1} style={{ marginTop: 2 }}>
                {linkMeta(link)}
              </AppText>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 2 }}>
              <AppText mono size={13.5}>
                {link.amount ? formatNaira(link.amount, { decimals: false }) : 'Any amount'}
              </AppText>
              <StatusTag status={link.linkStatus} plain />
            </View>
          </Row>
        ))}
        {links.data && all.length === 0 && queued.length === 0 && (
          <Empty title="No payment links yet" body="Create one and share it by WhatsApp or SMS." />
        )}
        {links.isError && !links.data && (
          <Empty title={isForbidden(links.error) ? "Your role can't manage payment links" : "Couldn't load links"} />
        )}
        {links.isLoading && <Empty title="Loading…" />}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  newBtn: { backgroundColor: colors.brand, borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 10 },
  featured: { marginHorizontal: 16, backgroundColor: colors.ink, borderRadius: 16, padding: 18 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activeTag: { backgroundColor: colors.success, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 },
  linkBox: {
    marginTop: 14,
    backgroundColor: 'rgba(244,238,221,0.1)',
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shareRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  shareBtn: { flex: 1, height: 44, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  shareCream: { backgroundColor: colors.cream },
  shareOutline: { borderWidth: 1, borderColor: colors.inkLine },
  oneTime: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.xl,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  list: { marginHorizontal: 16 },
});
