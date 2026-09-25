import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '@/theme';
import { AppText } from './text';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'] as const;
const LENGTH = 4;

/**
 * Bottom sheet with 4 PIN boxes and an in-app keypad (design 08). The PIN
 * lives only in this component's state and is handed to `onComplete` - it
 * is never stored anywhere else.
 */
export function PinSheet({
  visible,
  title = 'Enter transaction PIN',
  subtitle,
  busy,
  error,
  onComplete,
  onClose,
}: {
  visible: boolean;
  title?: string;
  subtitle?: string;
  busy?: boolean;
  error?: string | null;
  onComplete: (pin: string) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [pin, setPin] = useState('');

  // Fresh entry every time the sheet opens, and after a rejected PIN.
  useEffect(() => {
    if (visible) setPin('');
  }, [visible]);
  useEffect(() => {
    if (error) setPin('');
  }, [error]);

  function press(key: (typeof KEYS)[number]) {
    if (busy || !key) return;
    if (key === '⌫') return setPin((p) => p.slice(0, -1));
    const next = (pin + key).slice(0, LENGTH);
    setPin(next);
    if (next.length === LENGTH) onComplete(next);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={busy ? undefined : onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: 26 + insets.bottom }]}>
        <View style={styles.grabber} />
        <AppText weight="bold" size={17} align="center">
          {title}
        </AppText>
        {!!subtitle && (
          <AppText size={12.5} color={colors.subtle} align="center" style={{ marginTop: 4 }}>
            {subtitle}
          </AppText>
        )}

        <View style={styles.boxes} accessible accessibilityLabel={`${pin.length} of ${LENGTH} digits entered`}>
          {Array.from({ length: LENGTH }, (_, i) => {
            const filled = i < pin.length;
            return (
              <View key={i} style={[styles.box, filled && styles.boxFilled]}>
                {filled && <View style={styles.dot} />}
              </View>
            );
          })}
        </View>

        <View style={styles.status}>
          {busy ? (
            <ActivityIndicator color={colors.brand} />
          ) : error ? (
            <AppText size={12.5} color={colors.danger} align="center">
              {error}
            </AppText>
          ) : null}
        </View>

        <View style={styles.keys}>
          {KEYS.map((key, i) => (
            <Pressable
              key={i}
              onPress={() => press(key)}
              disabled={!key || busy}
              accessibilityRole={key ? 'button' : undefined}
              accessibilityLabel={key === '⌫' ? 'Delete' : key || undefined}
              style={({ pressed }) => [styles.key, pressed && key && { backgroundColor: colors.lineSoft }]}
            >
              <AppText mono size={22}>
                {key}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(32,38,74,0.35)' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: 22,
    paddingTop: 12,
    boxShadow: '0 -10px 30px rgba(32,38,74,0.12)',
  },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line, alignSelf: 'center', marginBottom: 16 },
  boxes: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 18 },
  box: { width: 46, height: 52, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  boxFilled: { borderWidth: 2, borderColor: colors.brand },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.ink },
  status: { height: 36, justifyContent: 'center' },
  keys: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 6 },
  key: { width: '33.33%', height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: radius.lg },
});
