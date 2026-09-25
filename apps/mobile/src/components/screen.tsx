import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@/theme';

/**
 * Page frame. Cream by default; `tone="brand"` is the blue full-bleed used by
 * sign-in, the one-time account and the receipt. Tab screens pass
 * edges={['top']} since the tab bar owns the bottom inset.
 */
export function Screen({
  children,
  tone = 'cream',
  scroll = true,
  edges = ['top', 'bottom'],
  footer,
  refreshing,
  onRefresh,
  contentStyle,
}: {
  children: ReactNode;
  tone?: 'cream' | 'brand';
  scroll?: boolean;
  edges?: Edge[];
  /** Pinned below the scroll area (primary action). */
  footer?: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: ViewStyle;
}) {
  const bg = tone === 'brand' ? colors.brand : colors.cream;
  return (
    <SafeAreaView edges={edges} style={[styles.flex, { backgroundColor: bg }]}>
      <StatusBar style={tone === 'brand' ? 'light' : 'dark'} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.content, contentStyle]}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={!!refreshing}
                  onRefresh={onRefresh}
                  tintColor={tone === 'brand' ? colors.cream : colors.brand}
                />
              ) : undefined
            }
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flex, contentStyle]}>{children}</View>
        )}
        {footer && <View style={styles.footer}>{footer}</View>}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: 24 },
  footer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, gap: 10 },
});
