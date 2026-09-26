import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ApiError, type TransferResolveResponse, type TransferResponse } from '@napayment/api-client';
import { transferSchema } from '@napayment/schemas';
import { AmountField } from '@/components/amount-field';
import { BackHeader } from '@/components/back-header';
import { Button } from '@/components/button';
import { Card, Row } from '@/components/card';
import { Field } from '@/components/field';
import { FormError } from '@/components/form-error';
import { PinSheet } from '@/components/pin-sheet';
import { Receipt, ReceiptLine, ReceiptRule } from '@/components/receipt';
import { Screen } from '@/components/screen';
import { StatusBadge } from '@/components/status-badge';
import { AppText } from '@/components/text';
import { newIdempotencyKey, useResolveRecipient, useTransfer, useWallet } from '@/hooks/queries';
import { useOnline } from '@/hooks/use-online';
import { errorMessage } from '@/lib/api';
import { formatDateTime, formatNaira, nairaToKobo } from '@napayment/format';
import { colors } from '@/theme';

/**
 * Send to another Napayment account (FR-Auth-1). Online-only: the PIN is
 * required per transfer and is never written to the offline outbox.
 */
export default function SendScreen() {
  const online = useOnline();
  const wallet = useWallet();
  const resolve = useResolveRecipient();
  const transfer = useTransfer();

  const [identifier, setIdentifier] = useState('');
  const [recipient, setRecipient] = useState<TransferResolveResponse | null>(null);
  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);
  const [done, setDone] = useState<TransferResponse | null>(null);

  const amountKobo = nairaToKobo(amount);

  function findRecipient() {
    setError(null);
    const id = identifier.replace(/\s/g, '');
    if (!id) return setError('Enter an account number or phone number.');
    if (!online) return setError("You're offline. Sending money needs a connection.");
    resolve.mutate(id, { onSuccess: setRecipient, onError: (e) => setError(errorMessage(e)) });
  }

  function review() {
    setError(null);
    if (!amountKobo) return setError('Enter an amount.');
    if (wallet.data && BigInt(amountKobo) > BigInt(wallet.data.balance)) return setError('That is more than your balance.');
    if (!online) return setError("You're offline. Sending money needs a connection.");
    setPinError(null);
    setPinOpen(true);
  }

  function send(pin: string) {
    const parsed = transferSchema.safeParse({
      recipientIdentifier: identifier.replace(/\s/g, ''),
      amount: amountKobo,
      narration: narration.trim() || undefined,
      transactionPin: pin,
    });
    if (!parsed.success) return setPinError(parsed.error.issues[0]?.message ?? 'Check the details.');
    transfer.mutate(
      { body: parsed.data, idempotencyKey },
      {
        onSuccess: (res) => {
          setPinOpen(false);
          setDone(res);
        },
        onError: (e) => {
          // Wrong PIN: stay in the sheet. Anything else: close it and show why.
          if (e instanceof ApiError && e.status < 500 && /pin/i.test(e.message)) {
            setPinError(errorMessage(e));
          } else {
            setPinOpen(false);
            setError(errorMessage(e));
            // A definite rejection means nothing moved - a retry is a new attempt.
            if (e instanceof ApiError) setIdempotencyKey(newIdempotencyKey());
          }
        },
      },
    );
  }

  if (done) {
    return (
      <Screen tone="brand" footer={<Button title="Done" variant="cream" onPress={() => router.navigate('/')} />}>
        <View style={styles.doneHead}>
          <StatusBadge kind="success" />
          <AppText weight="semibold" size={20} color={colors.cream} style={{ marginTop: 12 }}>
            Money sent
          </AppText>
          <AppText size={13} color={colors.brandSoft} style={{ marginTop: 4 }}>
            to {done.recipientDisplayName}
          </AppText>
        </View>
        <Receipt gap={8}>
          <ReceiptLine label="Amount" value={formatNaira(done.amount)} typewriter total />
          <ReceiptRule />
          <ReceiptLine label="Recipient" value={done.recipientDisplayName} typewriter />
          <ReceiptLine label="Date" value={formatDateTime(done.createdAt)} typewriter />
          <ReceiptLine label="New balance" value={formatNaira(done.senderNewBalance)} typewriter />
        </Receipt>
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        recipient ? (
          <Button title="Continue" onPress={review} disabled={!amountKobo} />
        ) : (
          <Button title="Find recipient" onPress={findRecipient} loading={resolve.isPending} />
        )
      }
    >
      <BackHeader title="Send money" subtitle="To another Napayment account, instantly." />
      <View style={styles.body}>
        <FormError message={error} />
        {!recipient ? (
          <Field
            label="Account number or phone"
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="10-digit account or 080…"
            keyboardType="phone-pad"
            mono
            autoFocus
            returnKeyType="search"
            onSubmitEditing={findRecipient}
          />
        ) : (
          <>
            <Card>
              <Row last>
                <View style={{ flex: 1 }}>
                  <AppText weight="semibold">{recipient.displayName}</AppText>
                  <AppText mono size={12} color={colors.subtle} style={{ marginTop: 2 }}>
                    {recipient.accountNumberMasked}
                  </AppText>
                </View>
                <AppText
                  size={12.5}
                  weight="semibold"
                  color={colors.brand}
                  onPress={() => {
                    setRecipient(null);
                    setAmount('');
                  }}
                  accessibilityRole="button"
                >
                  Change
                </AppText>
              </Row>
            </Card>
            <AmountField
              label="Amount"
              value={amount}
              onChangeText={setAmount}
              autoFocus
              hint={wallet.data ? `Balance ${formatNaira(wallet.data.balance)}` : undefined}
            />
            <Field label="Note (optional)" value={narration} onChangeText={setNarration} maxLength={128} placeholder="What's it for?" />
          </>
        )}
      </View>

      <PinSheet
        visible={pinOpen}
        subtitle={recipient && amountKobo ? `Sending ${formatNaira(amountKobo)} to ${recipient.displayName}` : undefined}
        busy={transfer.isPending}
        error={pinError}
        onComplete={send}
        onClose={() => !transfer.isPending && setPinOpen(false)}
      />
    </Screen>
  );
}


const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
  doneHead: { alignItems: 'center', paddingTop: 40 },
});
