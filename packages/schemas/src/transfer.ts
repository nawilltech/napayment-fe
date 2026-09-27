import { z } from "zod";
import { VALIDATION_MESSAGES } from "./messages";

/**
 * FR-Auth-1. `amount` here is already in kobo (minor units, matching the
 * wire format every other money amount in this app uses) - the Send Money
 * form converts the Naira the user types before validating against this
 * schema, the same naira<->kobo split `TransactionFilters` already does
 * locally rather than centralizing currency conversion in this package.
 */
export const transferSchema = z.object({
  recipientIdentifier: z.string().min(1, VALIDATION_MESSAGES.recipientRequired),
  amount: z
    .string()
    .regex(/^\d+$/, VALIDATION_MESSAGES.amountInvalid)
    .refine((value) => BigInt(value) > BigInt(0), VALIDATION_MESSAGES.amountNotPositive),
  narration: z.string().max(128, VALIDATION_MESSAGES.tooLong(128)).optional(),
  transactionPin: z.string().regex(/^\d{4}$/, VALIDATION_MESSAGES.transactionPinRequired),
});
export type TransferInput = z.infer<typeof transferSchema>;
