import { useState } from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';
import { setTransactionPinSchema } from '@napayment/schemas';
import { BackHeader } from '@/components/back-header';
import { Button } from '@/components/button';
import { Field } from '@/components/field';
import { FormError } from '@/components/form-error';
import { Screen } from '@/components/screen';
import { useSetTransactionPin } from '@/hooks/queries';
import { errorMessage } from '@/lib/api';
import { validate } from '@/lib/validation';

const digits = (v: string) => v.replace(/\D/g, '').slice(0, 4);

/** One form for first-time set and change - no endpoint says which applies (see setTransactionPinSchema). */
export default function TransactionPinScreen() {
  const setPin = useSetTransactionPin();
  const [form, setForm] = useState({ currentPassword: '', currentPin: '', pin: '', confirmPin: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    const result = validate(setTransactionPinSchema, form);
    setErrors(result.errors);
    if (!result.ok) return;
    setPin.mutate(
      { ...result.data, currentPin: result.data.currentPin || undefined },
      {
        onSuccess: () => {
          Alert.alert('PIN saved', 'Use it to approve transfers.');
          router.back();
        },
        onError: (e) => setError(errorMessage(e)),
      },
    );
  }

  return (
    <Screen footer={<Button title="Save PIN" onPress={submit} loading={setPin.isPending} />}>
      <BackHeader title="Transaction PIN" subtitle="4 digits, required for every transfer." />
      <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 16 }}>
        <FormError message={error} />
        <Field
          label="Current password"
          value={form.currentPassword}
          onChangeText={(v) => setForm((f) => ({ ...f, currentPassword: v }))}
          error={errors.currentPassword}
          secureTextEntry
          autoComplete="current-password"
        />
        <Field
          label="Current PIN"
          hint="Leave empty if you're setting a PIN for the first time."
          value={form.currentPin}
          onChangeText={(v) => setForm((f) => ({ ...f, currentPin: digits(v) }))}
          error={errors.currentPin}
          keyboardType="number-pad"
          secureTextEntry
          mono
        />
        <Field
          label="New PIN"
          value={form.pin}
          onChangeText={(v) => setForm((f) => ({ ...f, pin: digits(v) }))}
          error={errors.pin}
          keyboardType="number-pad"
          secureTextEntry
          mono
        />
        <Field
          label="Confirm new PIN"
          value={form.confirmPin}
          onChangeText={(v) => setForm((f) => ({ ...f, confirmPin: digits(v) }))}
          error={errors.confirmPin}
          keyboardType="number-pad"
          secureTextEntry
          mono
        />
      </View>
    </Screen>
  );
}
