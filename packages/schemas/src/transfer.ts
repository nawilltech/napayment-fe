import { z } from "zod";

/**
 * FR-Auth-1. `amount` here is already in kobo (minor units, matching the
 * wire format every other money amount in this app uses) - the Send Money
 * form converts the Naira the user types before validating against this
 * schema, the same naira<->kobo split `TransactionFilters` already does
 * locally rather than centralizing currency conversion in this package.
 */
export const transferSchema = z.object({
  recipientIdentifier: z.string().min(1, "Enter an account number or phone number"),
  amount: z
    .string()
    .regex(/^\d+$/, "Enter a valid amount")
    .refine((value) => BigInt(value) > BigInt(0), "Amount must be greater than zero"),
  narration: z.string().max(128, "Keep it under 128 characters").optional(),
  transactionPin: z.string().regex(/^\d{4}$/, "Enter your 4-digit transaction PIN"),
});
export type TransferInput = z.infer<typeof transferSchema>;
