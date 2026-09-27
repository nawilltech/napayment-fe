import { View } from 'react-native';
import { THEME_PREFERENCE_OPTIONS, THEME_PREFERENCES } from '@napayment/ui-tokens';
import { BackHeader } from '@/components/back-header';
import { ChoiceCard } from '@/components/choice-card';
import { Screen } from '@/components/screen';
import { AppText } from '@/components/text';
import { useColors, useTheme } from '@/theme/theme-provider';

/** Profile -> Preferences -> Appearance: Automatic (by time of day) / Light / Dark, saved on this device. */
export default function AppearanceScreen() {
  const colors = useColors();
  const { preference, scheme, setPreference } = useTheme();
  return (
    <Screen>
      <BackHeader title="Appearance" />
      <View style={{ paddingHorizontal: 16, gap: 10 }} accessibilityRole="radiogroup">
        {THEME_PREFERENCES.map((option) => (
          <ChoiceCard
            key={option}
            title={THEME_PREFERENCE_OPTIONS[option].label}
            body={THEME_PREFERENCE_OPTIONS[option].hint}
            selected={preference === option}
            onPress={() => setPreference(option)}
          />
        ))}
        {preference === 'auto' && (
          <AppText size={12.5} color={colors.subtle} style={{ marginTop: 4 }}>
            Now showing {scheme}.
          </AppText>
        )}
      </View>
    </Screen>
  );
}
