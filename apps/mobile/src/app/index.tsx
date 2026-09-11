import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

/**
 * Scaffold placeholder only - see docs/nawill-pay-frontend.md doc F1/F7 for
 * the Consumer Wallet App's intended screens (Onboarding, Home/balance,
 * Collect via payment link or dynamic account, Send - blocked on a backend
 * peer-to-peer endpoint, doc F9 - Notifications, Security/Settings) and
 * doc F10 for when each lands. Nothing here calls the backend yet.
 */
export default function ScaffoldHome() {
  return (
    <SafeAreaView style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedView style={styles.badge}>
          <ThemedText type="smallBold" themeColor="text">
            N
          </ThemedText>
        </ThemedView>

        <ThemedText type="title">Nawill Pay</ThemedText>
        <ThemedText type="subtitle" themeColor="textSecondary" style={styles.subtitle}>
          Consumer Wallet App - scaffold only
        </ThemedText>

        <ThemedView style={styles.card}>
          <ThemedText type="smallBold">Planned screens (doc F7)</ThemedText>
          {[
            'Onboarding (signup, KYC tier 1)',
            'Home - balance & virtual account',
            'Collect - share a payment link or dynamic account',
            'Send - blocked on a backend peer-to-peer endpoint (doc F9)',
            'Notifications',
            'Security & Settings',
          ].map((item) => (
            <ThemedText key={item} type="small" themeColor="textSecondary" style={styles.listItem}>
              {'•'} {item}
            </ThemedText>
          ))}
        </ThemedView>

        <ThemedText type="small" themeColor="textSecondary">
          Framework: React Native (Expo) + TypeScript - see doc F3 for the ADRs behind that choice.
        </ThemedText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    marginBottom: Spacing.three,
  },
  card: {
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  listItem: {
    marginTop: Spacing.half,
  },
});
