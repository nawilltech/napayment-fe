import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useOnline } from '@/hooks/use-online';
import { useQueuedActions } from '@/hooks/use-outbox';
import { formatTime } from '@napayment/format';
import { colors, radius } from '@/theme';
import { AppText } from './text';

/**
 * Amber strip shown while offline, or while anything is still queued.
 * `since` is when the data on screen was last fetched, so the user knows
 * the balance they're looking at is a snapshot, not live.
 */
export function OfflineBanner({ since }: { since?: number }) {
  const online = useOnline();
  const queued = useQueuedActions().length;
  if (online && queued === 0) return null;

  const parts = [
    online ? 'Back online, sending now.' : since ? `Showing data from ${formatTime(since)}.` : 'Showing saved data.',
    queued > 0 ? `${queued} ${queued === 1 ? 'action' : 'actions'} queued.` : null,
  ].filter(Boolean);

  return (
    <Pressable
      onPress={() => router.push('/queue')}
      accessibilityRole="button"
      accessibilityLabel={`${online ? 'Syncing' : 'Offline'}. ${parts.join(' ')} Open queue.`}
      style={styles.banner}
    >
      <View style={styles.dot} />
      <AppText size={12.5} color={colors.warningInk} style={styles.flex}>
        <AppText size={12.5} weight="bold" color={colors.warningInk}>
          {online ? 'Syncing. ' : 'Offline. '}
        </AppText>
        {parts.join(' ')}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.warningSurface,
    borderWidth: 1,
    borderColor: colors.warningLine,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.warning },
  flex: { flex: 1 },
});
