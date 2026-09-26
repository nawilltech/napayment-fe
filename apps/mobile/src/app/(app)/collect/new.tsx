import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { AmountField } from '@/components/amount-field';
import { BackHeader } from '@/components/back-header';
import { Button } from '@/components/button';
import { ChoiceCard } from '@/components/choice-card';
import { Field } from '@/components/field';
import { FormError } from '@/components/form-error';
import { Screen } from '@/components/screen';
import { Segmented } from '@/components/segmented';
import { AppText } from '@/components/text';
import { useCreateDynamicAccount } from '@/hooks/queries';
import { useOnline } from '@/hooks/use-online';
import { errorMessage } from '@/lib/api';
import { formatNaira, nairaToKobo } from '@napayment/format';
import { newIdempotencyKey, outboxKeys, type CreateLinkVars } from '@/lib/outbox';
import { colors, radius } from '@/theme';

type Method = 'account' | 'link';
type LinkType = 'PERMANENT' | 'TEMPORARY';

export default function NewCollectionScreen() {
  const params = useLocalSearchParams<{ method?: Method }>();
  const online = useOnline();
  const [method, setMethod] = useState<Method>(params.method === 'link' ? 'link' : 'account');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [linkType, setLinkType] = useState<LinkType>('PERMANENT');
  const [singleUse, setSingleUse] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAccount = useCreateDynamicAccount();
  const createLink = useMutation<unknown, Error, CreateLinkVars>({ mutationKey: outboxKeys.createLink });

  const amountKobo = nairaToKobo(amount);
  const amountInvalid = amount.trim() !== '' && !amountKobo;

  function submit() {
    setError(null);
    if (amountInvalid) return setError('Enter a valid amount, or leave it empty.');

    if (method === 'account') {
      if (!online) return setError('One-time accounts need a connection. Try again when you are back online.');
      createAccount.mutate(
        { expectedAmount: amountKobo, reference: reference.trim() || undefined },
        {
          onSuccess: (account) => router.replace({ pathname: '/collect/account/[id]', params: { id: account.id } }),
          onError: (e) => setError(errorMessage(e)),
        },
      );
      return;
    }

    // Idempotency key is minted now, at tap time, so an offline replay can't double-create.
    createLink.mutate(
      {
        body: { amount: amountKobo, linkType, singleUse },
        idempotencyKey: newIdempotencyKey(),
        display: {
          title: `Payment link · ${linkType === 'PERMANENT' ? 'Permanent' : 'Temporary'}`,
          detail: `${singleUse ? 'Single use' : 'Multi-use'} · created offline`,
          amount: amountKobo ?? null,
          createdAt: Date.now(),
        },
      },
      { onError: (e) => setError(errorMessage(e)) },
    );
    // Offline: it's paused in the outbox and will send on reconnect - don't wait on it.
    router.navigate('/collect');
  }

  const busy = createAccount.isPending || (online && createLink.isPending);

  return (
    <Screen
      footer={
        <Button
          title={method === 'account' ? 'Generate account number' : online ? 'Create payment link' : 'Queue payment link'}
          onPress={submit}
          loading={busy}
        />
      }
    >
      <BackHeader title="New collection" subtitle="How will the payer send money?" />

      <View style={styles.choices}>
        <ChoiceCard
          title="One-time account number"
          body="Payer transfers from any bank app or USSD. Expires in 30 minutes. Best for walk-in payments."
          selected={method === 'account'}
          onPress={() => setMethod('account')}
        />
        <ChoiceCard
          title="Payment link"
          body="Share by WhatsApp or SMS. Permanent for recurring fees, or temporary for one bill."
          selected={method === 'link'}
          onPress={() => setMethod('link')}
        />
      </View>

      <View style={styles.form}>
        <FormError message={error} />
        <AmountField
          label="Amount (optional)"
          value={amount}
          onChangeText={setAmount}
          error={amountInvalid ? 'Enter a valid amount' : undefined}
          hint={amountKobo ? undefined : 'Leave empty to let the payer enter any amount.'}
          accessibilityLabel={amountKobo ? `Amount ${formatNaira(amountKobo)}` : 'Amount'}
        />

        {method === 'account' ? (
          <Field
            label="Reference"
            value={reference}
            onChangeText={setReference}
            placeholder="e.g. Chidera Okafor · JSS 2B · Term 1"
            maxLength={120}
          />
        ) : (
          <>
            <View style={{ gap: 6 }}>
              <AppText weight="semibold" size={13}>
                Link type
              </AppText>
              <Segmented
                value={linkType}
                onChange={setLinkType}
                options={[
                  { value: 'PERMANENT', label: 'Permanent' },
                  { value: 'TEMPORARY', label: 'Temporary' },
                ]}
              />
              <AppText size={12} color={colors.subtle}>
                {linkType === 'PERMANENT'
                  ? 'Stays open until you revoke it.'
                  : 'Expires after 24 hours.'}
              </AppText>
            </View>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <AppText weight="semibold" size={13.5}>
                  Single use
                </AppText>
                <AppText size={12} color={colors.subtle} style={{ marginTop: 2 }}>
                  Close after the first payment
                </AppText>
              </View>
              <Switch
                value={singleUse}
                onValueChange={setSingleUse}
                trackColor={{ false: colors.line, true: colors.brand }}
                thumbColor={colors.white}
                ios_backgroundColor={colors.line}
                accessibilityLabel="Single use"
              />
            </View>
            {!online && (
              <AppText size={12} color={colors.warningInk}>
                You're offline. The link is saved and created as soon as you reconnect.
              </AppText>
            )}
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  choices: { paddingHorizontal: 16, paddingTop: 14, gap: 10 },
  form: { paddingHorizontal: 20, paddingTop: 22, gap: 16 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
