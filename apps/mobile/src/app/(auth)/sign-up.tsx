import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';
import { businessSignupSchema, DEFAULT_CALLING_CODE, individualSignupSchema } from '@napayment/schemas';
import { AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/button';
import { Field } from '@/components/field';
import { FormError } from '@/components/form-error';
import { Segmented } from '@/components/segmented';
import { ShowToggle } from '@/components/show-toggle';
import { AppText } from '@/components/text';
import { useSession } from '@/hooks/use-session';
import { errorMessage } from '@/lib/api';
import { validate } from '@/lib/validation';
import { colors, radius } from '@/theme';

type Kind = 'individual' | 'business';

export default function SignUpScreen() {
  const { signUp } = useSession();
  const [kind, setKind] = useState<Kind>('individual');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    cacNumber: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  async function submit() {
    const local = form.phone.replace(/\D/g, '').replace(/^0/, '');
    const values = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phoneNo: `${DEFAULT_CALLING_CODE.dialCode}${local}`,
      password: form.password,
      confirmPassword: form.confirmPassword,
      ...(kind === 'business' ? { businessName: form.businessName.trim(), cacNumber: form.cacNumber.trim().toUpperCase() } : {}),
    };
    const result = validate(kind === 'business' ? businessSignupSchema : individualSignupSchema, values);
    setErrors(result.errors);
    if (!result.ok) return;
    setBusy(true);
    setFormError(null);
    try {
      await signUp(result.data);
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell compact>
      <View>
        <AppText weight="bold" size={22}>
          Create your account
        </AppText>
        <AppText size={13.5} color={colors.muted} style={{ marginTop: 4 }}>
          Takes about a minute.
        </AppText>
      </View>

      <Segmented
        value={kind}
        onChange={setKind}
        options={[
          { value: 'individual', label: 'Individual' },
          { value: 'business', label: 'Business' },
        ]}
      />

      <FormError message={formError} />

      {kind === 'business' && (
        <>
          <Field label="Business name" value={form.businessName} onChangeText={set('businessName')} error={errors.businessName} />
          <Field
            label="CAC number"
            value={form.cacNumber}
            onChangeText={set('cacNumber')}
            error={errors.cacNumber}
            placeholder="RC1234567"
            autoCapitalize="characters"
            mono
          />
        </>
      )}
      <View style={styles.pair}>
        <View style={styles.flex}>
          <Field label="First name" value={form.firstName} onChangeText={set('firstName')} error={errors.firstName} autoComplete="given-name" />
        </View>
        <View style={styles.flex}>
          <Field label="Last name" value={form.lastName} onChangeText={set('lastName')} error={errors.lastName} autoComplete="family-name" />
        </View>
      </View>
      <Field
        label="Email"
        value={form.email}
        onChangeText={set('email')}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <View style={styles.phoneRow}>
        <View style={styles.dial}>
          <AppText mono size={15}>
            {DEFAULT_CALLING_CODE.dialCode}
          </AppText>
        </View>
        <View style={styles.flex}>
          <Field
            value={form.phone}
            onChangeText={set('phone')}
            placeholder="801 234 5678"
            keyboardType="phone-pad"
            autoComplete="tel"
            mono
            accessibilityLabel="Phone number"
          />
        </View>
      </View>
      {errors.phoneNo && (
        <AppText size={12} color={colors.danger} style={{ marginTop: -8 }}>
          {errors.phoneNo}
        </AppText>
      )}
      <Field
        label="Password"
        value={form.password}
        onChangeText={set('password')}
        error={errors.password}
        hint="8+ characters with upper, lower, a digit and a symbol."
        secureTextEntry={!showPassword}
        autoComplete="new-password"
        suffix={<ShowToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
      />
      <Field
        label="Confirm password"
        value={form.confirmPassword}
        onChangeText={set('confirmPassword')}
        error={errors.confirmPassword}
        secureTextEntry={!showPassword}
        autoComplete="new-password"
      />
      <Button title="Create account" onPress={submit} loading={busy} style={{ marginTop: 4 }} />
      <AppText size={13} color={colors.muted} align="center">
        Already have an account?{' '}
        <Link href="/sign-in" accessibilityRole="link">
          <AppText size={13} weight="semibold" color={colors.brand}>
            Sign in
          </AppText>
        </Link>
      </AppText>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  pair: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
  phoneRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  dial: { height: 50, paddingHorizontal: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, justifyContent: 'center' },
});
