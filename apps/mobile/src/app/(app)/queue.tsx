import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { BackHeader } from '@/components/back-header';
import { Card, Row } from '@/components/card';
import { Empty } from '@/components/empty';
import { Screen } from '@/components/screen';
import { StatusTag } from '@/components/status-tag';
import { AppText } from '@/components/text';
import { useOnline } from '@/hooks/use-online';
import { useQueuedActions } from '@/hooks/use-outbox';
import { formatNaira, formatTime } from '@/lib/format';
import { queryClient } from '@/lib/query';
import { colors, radius } from '@/theme';

export default function QueueScreen() {
  const online = useOnline();
  const queued = useQueuedActions();
  const [checkedAt, setCheckedAt] = useState(Date.now());

  async function retry() {
    await NetInfo.refresh();
    setCheckedAt(Date.now());
    await queryClient.resumePausedMutations();
  }

  return (
    <Screen>
      <BackHeader
        title="Waiting to send"
        subtitle="These send automatically when you're back online. Each is sent once, even if it retries."
      />
      <View style={styles.body}>
        <View style={[styles.status, online && styles.statusOnline]}>
          <View style={[styles.dot, { backgroundColor: online ? colors.success : colors.warning }]} />
          <View style={{ flex: 1 }}>
            <AppText weight="semibold" color={online ? colors.successInk : colors.warningInk}>
              {online ? 'Connected' : 'No connection'}
            </AppText>
            <AppText size={12} color={online ? colors.successInk : colors.warningInk} style={{ marginTop: 2 }}>
              Last checked {formatTime(checkedAt)}
            </AppText>
          </View>
          <Pressable
            onPress={retry}
            accessibilityRole="button"
            style={[styles.retry, { borderColor: online ? colors.success : colors.warning }]}
          >
            <AppText size={12.5} weight="semibold" color={online ? colors.successInk : colors.warningInk}>
              Retry now
            </AppText>
          </Pressable>
        </View>

        <Card>
          {queued.map((q, i) => (
            <Row key={q.id} last={i === queued.length - 1} style={{ paddingVertical: 13 }}>
              <View style={{ flex: 1 }}>
                <AppText weight="semibold">{q.title}</AppText>
                <AppText size={11.5} color={colors.subtle} style={{ marginTop: 4 }} numberOfLines={1}>
                  {q.detail} · {formatTime(q.createdAt)}
                </AppText>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <AppText mono size={13.5}>
                  {q.amount ? formatNaira(q.amount, { decimals: false }) : 'Any amount'}
                </AppText>
                <StatusTag status="QUEUED" plain />
              </View>
            </Row>
          ))}
          {queued.length === 0 && <Empty title="Nothing waiting" body="Everything you did has been sent." />}
        </Card>

        <AppText size={12} color={colors.subtle} style={{ lineHeight: 18 }}>
          Withdrawals are never shown as sent until the bank confirms. Sending money to another account needs a
          connection, so it is never queued.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingTop: 14, gap: 14 },
  status: {
    backgroundColor: colors.warningSurface,
    borderWidth: 1,
    borderColor: colors.warningLine,
    borderRadius: radius.xl,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusOnline: { backgroundColor: colors.successSurface, borderColor: '#BFE3CF' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  retry: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 7 },
});
