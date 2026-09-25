import { useState } from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';
import { changePasswordSchema } from '@napayment/schemas';
import { BackHeader } from '@/components/back-header';
import { Button } from '@/components/button';
import { Field } from '@/components/field';
import { FormError } from '@/components/form-error';
import { Screen } from '@/components/screen';
import { useChangePassword } from '@/hooks/queries';
import { errorMessage } from '@/lib/api';
import { validate } from '@/lib/validation';

export default function ChangePasswordScreen() {
  const change = useChangePassword();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  function submit() {
    setError(null);
    const result = validate(changePasswordSchema, form);
    setErrors(result.errors);
    if (!result.ok) return;
    const { currentPassword, newPassword, confirmPassword } = result.data;
    change.mutate(
      { currentPassword, newPassword, confirmNewPassword: confirmPassword },
      {
        onSuccess: () => {
          Alert.alert('Password changed');
          router.back();
        },
        onError: (e) => setError(errorMessage(e)),
      },
    );
  }

  return (
    <Screen footer={<Button title="Change password" onPress={submit} loading={change.isPending} />}>
      <BackHeader title="Change password" />
      <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 16 }}>
        <FormError message={error} />
        <Field label="Current password" value={form.currentPassword} onChangeText={set('currentPassword')} error={errors.currentPassword} secureTextEntry autoComplete="current-password" />
        <Field
          label="New password"
          value={form.newPassword}
          onChangeText={set('newPassword')}
          error={errors.newPassword}
          hint="8+ characters with upper, lower, a digit and a symbol."
          secureTextEntry
          autoComplete="new-password"
        />
        <Field label="Confirm new password" value={form.confirmPassword} onChangeText={set('confirmPassword')} error={errors.confirmPassword} secureTextEntry autoComplete="new-password" />
      </View>
    </Screen>
  );
}
