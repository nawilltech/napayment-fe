import { Field, type FieldProps } from './field';
import { AppText } from './text';
import { formatAmountInput } from '@napayment/format';
import { colors } from '@/theme';

/** Large mono naira entry (design 03): "₦" prefix, thousands grouped as you type. */
export function AmountField({ value, onChangeText, ...props }: FieldProps & { value: string; onChangeText: (v: string) => void }) {
  return (
    <Field
      large
      mono
      keyboardType="decimal-pad"
      placeholder="0"
      value={value}
      onChangeText={(v) => onChangeText(formatAmountInput(v))}
      prefix={
        <AppText mono size={22} color={colors.subtle}>
          ₦
        </AppText>
      }
      {...props}
    />
  );
}
