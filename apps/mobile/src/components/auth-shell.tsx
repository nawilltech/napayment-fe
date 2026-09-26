import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors, radius } from '@/theme';
import { LogoMark, Wordmark } from './logo';
import { AppText } from './text';

/** Blue brand panel over a cream sheet (design 01 Sign in). `compact` shrinks the panel for longer forms. */
export function AuthShell({ children, compact }: { children: ReactNode; compact?: boolean }) {
  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" bounces={false}>
          <View style={[styles.hero, compact && styles.heroCompact]}>
            <LogoMark size={compact ? 48 : 76} tile={colors.cream} letter={colors.brand} />
            <Wordmark size={compact ? 24 : 34} color={colors.cream} />
            {!compact && (
              <AppText size={14} color={colors.brandSoft} align="center">
                Collect fees and bills for schools, hospitals,{'\n'}agencies and businesses. Works on weak network.
              </AppText>
            )}
          </View>
          <SafeAreaView edges={['bottom']} style={styles.sheet}>
            {children}
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.brand },
  scroll: { flexGrow: 1 },
  hero: { flex: 1, minHeight: 300, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 28, paddingVertical: 32 },
  heroCompact: { minHeight: 0, flex: 0, gap: 10, paddingVertical: 24 },
  sheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 30,
    gap: 14,
    flexGrow: 0,
  },
});

export const authStyles = StyleSheet.create({
  links: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  errorBox: { backgroundColor: colors.dangerSurface, borderRadius: radius.lg, padding: 12 },
});
