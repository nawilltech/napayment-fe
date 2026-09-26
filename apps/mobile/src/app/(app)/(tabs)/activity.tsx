import { useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, SectionList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { TransactionFilter, TransactionResponse, TransactionType } from '@napayment/api-client';
import { Chip } from '@/components/chip';
import { Empty } from '@/components/empty';
import { Field } from '@/components/field';
import { OfflineBanner } from '@/components/offline-banner';
import { AppText } from '@/components/text';
import { TransactionRow } from '@/components/transaction-row';
import { useAnalytics, useTransactionFeed } from '@/hooks/queries';
import { isForbidden } from '@/lib/api';
import { dayLabel, formatNaira } from '@napayment/format';
import { colors, radius } from '@/theme';

/** Monday 00:00 local - "this week" for both the chip and the tiles. */
function startOfWeek() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.toISOString();
}

export default function ActivityScreen() {
  const [type, setType] = useState<TransactionType | undefined>();
  const [thisWeek, setThisWeek] = useState(false);
  const [draft, setDraft] = useState('');
  const [term, setTerm] = useState('');

  const weekStart = useMemo(startOfWeek, []);
  const filter: TransactionFilter = {
    type,
    term: term || undefined,
    fromDate: thisWeek ? weekStart : undefined,
  };
  const feed = useTransactionFeed(filter);
  const week = useAnalytics({ fromDate: weekStart });

  const sections = useMemo(() => {
    const out: { title: string; data: TransactionResponse[] }[] = [];
    for (const txn of feed.data?.pages.flatMap((p) => p.content) ?? []) {
      const title = dayLabel(txn.createdAt);
      const last = out[out.length - 1];
      if (last?.title === title) last.data.push(txn);
      else out.push({ title, data: [txn] });
    }
    return out;
  }, [feed.data]);

  const header = (
    <View>
      <View style={styles.title}>
        <AppText weight="bold" size={22}>
          Activity
        </AppText>
      </View>
      <OfflineBanner since={feed.dataUpdatedAt || undefined} />
      <View style={{ paddingHorizontal: 16 }}>
        <Field
          value={draft}
          onChangeText={setDraft}
          placeholder="Search by session ID"
          accessibilityLabel="Search by session ID"
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={() => setTerm(draft.trim())}
          onBlur={() => setTerm(draft.trim())}
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="All" on={!type} onPress={() => setType(undefined)} />
        <Chip label="Money in" on={type === 'CREDIT'} onPress={() => setType('CREDIT')} />
        <Chip label="Money out" on={type === 'DEBIT'} onPress={() => setType('DEBIT')} />
        <Chip label="This week" on={thisWeek} onPress={() => setThisWeek((v) => !v)} />
      </ScrollView>
      {week.data && (
        <View style={styles.tiles}>
          <View style={styles.tile}>
            <AppText size={11.5} color={colors.subtle}>
              In, this week
            </AppText>
            <AppText mono weight="semibold" size={17} color={colors.success} style={{ marginTop: 3 }}>
              {formatNaira(week.data.creditVolume, { decimals: false })}
            </AppText>
          </View>
          <View style={styles.tile}>
            <AppText size={11.5} color={colors.subtle}>
              Out, this week
            </AppText>
            <AppText mono weight="semibold" size={17} style={{ marginTop: 3 }}>
              {formatNaira(week.data.debitVolume, { decimals: false })}
            </AppText>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <SectionList
        sections={sections}
        keyExtractor={(t) => t.id}
        ListHeaderComponent={header}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHead}>
            <AppText eyebrow>{section.title}</AppText>
          </View>
        )}
        renderItem={({ item, index, section }) => (
          <View
            style={[
              styles.cardSlice,
              index === 0 && styles.cardTop,
              index === section.data.length - 1 && styles.cardBottom,
            ]}
          >
            <TransactionRow txn={item} tagged last={index === section.data.length - 1} />
          </View>
        )}
        onEndReachedThreshold={0.4}
        onEndReached={() => feed.hasNextPage && !feed.isFetchingNextPage && feed.fetchNextPage()}
        refreshControl={
          <RefreshControl
            refreshing={feed.isRefetching && !feed.isFetchingNextPage}
            onRefresh={() => {
              feed.refetch();
              week.refetch();
            }}
            tintColor={colors.brand}
          />
        }
        ListEmptyComponent={
          feed.isLoading ? (
            <ActivityIndicator color={colors.brand} style={{ marginTop: 32 }} />
          ) : feed.isError && !feed.data ? (
            <Empty title={isForbidden(feed.error) ? "Your role can't view transactions" : "Couldn't load activity"} body="Pull down to try again." />
          ) : (
            <Empty title="Nothing here yet" body={term || type || thisWeek ? 'Try a different filter.' : 'Payments will show here.'} />
          )
        }
        ListFooterComponent={
          feed.isFetchingNextPage ? <ActivityIndicator color={colors.brand} style={{ marginVertical: 16 }} /> : <View style={{ height: 24 }} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  title: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 },
  chips: { gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  tiles: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginTop: 14 },
  tile: { flex: 1, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: radius.xl, padding: 12 },
  sectionHead: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6 },
  // Rows render as slices of one bordered card per day.
  cardSlice: { marginHorizontal: 16, backgroundColor: colors.white, borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  cardTop: { borderTopWidth: 1, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
  cardBottom: { borderBottomWidth: 1, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
});
