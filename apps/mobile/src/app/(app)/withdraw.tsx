import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { AmountField } from '@/components/amount-field';
import { BackHeader } from '@/components/back-header';
import { Button } from '@/components/button';
import { Card, Row } from '@/components/card';
import { Empty } from '@/components/empty';
import { FormError } from '@/components/form-error';
import { Screen } from '@/components/screen';
import { AppText } from '@/components/text';
import { useBankAccounts, useBanks, useSettlementAccounts, useWallet } from '@/hooks/queries';
import { useOnline } from '@/hooks/use-online';
import { errorMessage, isForbidden } from '@/lib/api';
import { formatNaira, nairaToKobo } from '@/lib/format';
import { newIdempotencyKey, outboxKeys, type SettleVars } from '@/lib/outbox';
import { colors } from '@/theme';

/**
 * Withdraw = settle the wallet balance out to the business's settlement
 * bank account(s), split by their configured percentages (POST /settlements).
 *
 * The backend doesn't take a transaction PIN on settlements (doc F9), so
 * this confirms explicitly instead of showing a PIN pad that nothing checks.
 */
export default function WithdrawScreen() {
  const online = useOnline();
  const wallet = useWallet();
  const settlementAccounts = useSettlementAccounts();
  const bankAccounts = useBankAccounts();
  const banks = useBanks();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const settle = useMutation<unknown, Error, SettleVars>({ mutationKey: outboxKeys.settle });

  const destinations = useMemo(() => {
    const byId = new Map(bankAccounts.data?.content.map((b) => [b.id, b]));
    return (settlementAccounts.data?.content ?? []).map((s) => {
      const bank = byId.get(s.bankAccountId);
      return {
        id: s.id,
        bankName: bank ? (banks.data?.get(bank.bankId) ?? 'Bank') : 'Bank account',
        last4: bank?.accountNumber.slice(-4) ?? '····',
        accountName: bank?.accountName ?? '',
        split: `${Number(s.splitPercentage)}%`,
      };
    });
  }, [settlementAccounts.data, bankAccounts.data, banks.data]);

  const balance = wallet.data?.balance;
  const amountKobo = nairaToKobo(amount);
  const tooMuch = !!(amountKobo && balance && BigInt(amountKobo) > BigInt(balance));
  const label = amountKobo ? formatNaira(amountKobo) : 'the full balance';

  function confirm() {
    setError(null);
    if (amount.trim() && !amountKobo) return setError('Enter a valid amount, or leave it empty to withdraw everything.');
    if (tooMuch) return setError('That is more than your available balance.');
    const where = destinations.length === 1 ? `${destinations[0].bankName} ···${destinations[0].last4}` : `${destinations.length} accounts, split by your settings`;
    Alert.alert('Confirm withdrawal', `Send ${label} to ${where}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Withdraw', onPress: submit },
    ]);
  }

  function submit() {
    settle.mutate(
      {
        body: { amount: amountKobo },
        idempotencyKey: newIdempotencyKey(),
        display: {
          title: 'Withdrawal',
          detail: destinations.map((d) => `${d.bankName} ···${d.last4}`).join(', '),
          amount: amountKobo ?? balance ?? null,
          createdAt: Date.now(),
        },
      },
      {
        onSuccess: () => {
          Alert.alert('Withdrawal requested', 'It shows as processing until the bank confirms.');
          router.back();
        },
        onError: (e) => setError(errorMessage(e)),
      },
    );
    if (!online) {
      Alert.alert('Queued', "You're offline. The withdrawal sends automatically when you reconnect, and won't show as sent until the bank confirms.");
      router.back();
    }
  }

  const loading = settlementAccounts.isLoading || bankAccounts.isLoading;
  const noDestination = settlementAccounts.data && destinations.length === 0;

  return (
    <Screen
      footer={
        <Button
          title={online ? 'Withdraw' : 'Queue withdrawal'}
          onPress={confirm}
          loading={online && settle.isPending}
          disabled={loading || !!noDestination || !destinations.length}
        />
      }
    >
      <BackHeader title="Withdraw to bank" />
      <View style={styles.body}>
        <Card>
          {destinations.map((d, i) => (
            <Row key={d.id} last={i === destinations.length - 1}>
              <View style={{ flex: 1 }}>
                <AppText weight="semibold">
                  {d.bankName} ···{d.last4}
                </AppText>
                {!!d.accountName && (
                  <AppText size={12} color={colors.subtle} style={{ marginTop: 2 }}>
                    {d.accountName}
                  </AppText>
                )}
              </View>
              {destinations.length > 1 && (
                <AppText mono weight="semibold" size={14}>
                  {d.split}
                </AppText>
              )}
            </Row>
          ))}
          {loading && <Empty title="Loading…" />}
          {noDestination && (
            <Empty title="No settlement bank yet" body="Add one in the Business Console under Settlements, then withdraw here." />
          )}
          {settlementAccounts.isError && !settlementAccounts.data && (
            <Empty
              title={isForbidden(settlementAccounts.error) ? "Your role can't withdraw" : "Couldn't load your bank"}
              body={isForbidden(settlementAccounts.error) ? 'Ask the account owner.' : 'Check your connection.'}
            />
          )}
        </Card>

        <View>
          <AppText size={12.5} color={colors.subtle}>
            Available
          </AppText>
          <AppText mono weight="semibold" size={30} style={{ marginTop: 2 }}>
            {balance ? formatNaira(balance) : '—'}
          </AppText>
        </View>

        <FormError message={error} />
        <AmountField
          label="Amount"
          value={amount}
          onChangeText={setAmount}
          error={tooMuch ? 'More than your available balance' : undefined}
          hint="Leave empty to withdraw the full balance."
        />
        <AppText size={12} color={colors.subtle}>
          Withdrawals are never shown as sent until the bank confirms.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
});
