import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { forgotPasswordSchema, resetPasswordSchema } from '@napayment/schemas';
import { AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/button';
import { Field } from '@/components/field';
import { FormError } from '@/components/form-error';
import { AppText } from '@/components/text';
import { errorMessage, publicClient } from '@/lib/api';
import { validate } from '@/lib/validation';
import { colors } from '@/theme';

/** Two steps on one screen: request a 6-digit code, then set a new password with it. */
export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<'request' | 'reset' | 'done'>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setFormError(null);
    try {
      await fn();
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  function requestCode() {
    const result = validate(forgotPasswordSchema, { email: email.trim() });
    setErrors(result.errors);
    if (!result.ok) return;
    run(async () => {
      await publicClient.auth.forgotPassword(result.data);
      setStep('reset');
    });
  }

  function reset() {
    const result = validate(resetPasswordSchema, { email: email.trim(), token: token.trim(), newPassword, confirmNewPassword });
    setErrors(result.errors);
    if (!result.ok) return;
    run(async () => {
      await publicClient.auth.resetPassword(result.data);
      setStep('done');
    });
  }

  return (
    <AuthShell compact>
      <View>
        <AppText weight="bold" size={22}>
          {step === 'done' ? 'Password changed' : 'Reset your password'}
        </AppText>
        <AppText size={13.5} color={colors.muted} style={{ marginTop: 4 }}>
          {step === 'request'
            ? "We'll email you a 6-digit code."
            : step === 'reset'
              ? `Enter the code sent to ${email.trim()}.`
              : 'Sign in with your new password.'}
        </AppText>
      </View>
      <FormError message={formError} />

      {step === 'request' && (
        <>
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Button title="Send code" onPress={requestCode} loading={busy} />
        </>
      )}

      {step === 'reset' && (
        <>
          <Field
            label="6-digit code"
            value={token}
            onChangeText={(v) => setToken(v.replace(/\D/g, '').slice(0, 6))}
            error={errors.token}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            mono
          />
          <Field
            label="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            error={errors.newPassword}
            secureTextEntry
            autoComplete="new-password"
          />
          <Field
            label="Confirm new password"
            value={confirmNewPassword}
            onChangeText={setConfirm}
            error={errors.confirmNewPassword}
            secureTextEntry
            autoComplete="new-password"
          />
          <Button title="Change password" onPress={reset} loading={busy} />
          <Button title="Resend code" variant="ghost" size="md" onPress={requestCode} disabled={busy} />
        </>
      )}

      {step === 'done' && <Button title="Back to sign in" onPress={() => router.replace('/sign-in')} />}
      {step !== 'done' && <Button title="Back to sign in" variant="ghost" size="md" onPress={() => router.back()} />}
    </AuthShell>
  );
}
