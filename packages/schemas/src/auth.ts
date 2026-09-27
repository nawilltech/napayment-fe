import { z } from "zod";
import { phoneNoSchema } from "./phone";
import { VALIDATION_MESSAGES } from "./messages";

/**
 * Mirrors the backend's @StrongPassword bean-validation constraint
 * (common-core/validation/StrongPassword.java): >= 8 chars, upper + lower +
 * digit + special char. Validating this client-side means a weak password
 * fails fast locally instead of round-tripping to the backend first - a real
 * win on the poor-connectivity conditions the backend is designed around
 * (NFR-2).
 */
export const strongPasswordSchema = z
  .string()
  .min(8, VALIDATION_MESSAGES.passwordTooShort)
  .regex(/[a-z]/, VALIDATION_MESSAGES.passwordNeedsLowercase)
  .regex(/[A-Z]/, VALIDATION_MESSAGES.passwordNeedsUppercase)
  .regex(/\d/, VALIDATION_MESSAGES.passwordNeedsDigit)
  .regex(/[^A-Za-z0-9]/, VALIDATION_MESSAGES.passwordNeedsSpecial);

/**
 * Base object fields, kept separate from the exported schemas below: Zod's
 * `.refine()` (needed for the password/confirmPassword match check, which
 * mirrors the backend's own `SignupRequest` check) returns a `ZodEffects`,
 * not a `ZodObject` - and `ZodEffects` has no `.extend()`. So the business
 * variant must `.extend()` this base *before* either variant applies its
 * own `.refine()`, not the other way around.
 */
const baseSignupFields = z.object({
  firstName: z.string().min(1, VALIDATION_MESSAGES.required),
  middleName: z.string().optional(),
  lastName: z.string().min(1, VALIDATION_MESSAGES.required),
  email: z.string().email(VALIDATION_MESSAGES.emailInvalid),
  phoneNo: phoneNoSchema,
  password: strongPasswordSchema,
  confirmPassword: z.string().min(1, VALIDATION_MESSAGES.required),
});

function passwordsMatch(data: { password: string; confirmPassword: string }) {
  return data.password === data.confirmPassword;
}
const PASSWORDS_MATCH_ISSUE = { message: VALIDATION_MESSAGES.passwordsMismatch, path: ["confirmPassword"] };

export const individualSignupSchema = baseSignupFields.refine(passwordsMatch, PASSWORDS_MATCH_ISSUE);

export const businessSignupSchema = baseSignupFields
  .extend({
    businessName: z.string().min(2, VALIDATION_MESSAGES.required),
    cacNumber: z
      .string()
      .min(1, VALIDATION_MESSAGES.required)
      .regex(/^(RC|BN|IT)\d{4,10}$/i, VALIDATION_MESSAGES.cacNumberFormat),
  })
  .refine(passwordsMatch, PASSWORDS_MATCH_ISSUE);

export type IndividualSignupInput = z.infer<typeof individualSignupSchema>;
export type BusinessSignupInput = z.infer<typeof businessSignupSchema>;

export const loginSchema = z.object({
  email: z.string().email(VALIDATION_MESSAGES.emailInvalid),
  password: z.string().min(1, VALIDATION_MESSAGES.required),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email(VALIDATION_MESSAGES.emailInvalid),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    email: z.string().email(VALIDATION_MESSAGES.emailInvalid),
    token: z.string().regex(/^\d{6}$/, VALIDATION_MESSAGES.resetCodeInvalid),
    newPassword: strongPasswordSchema,
    confirmNewPassword: z.string().min(1, VALIDATION_MESSAGES.required),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: VALIDATION_MESSAGES.passwordsMismatch,
    path: ["confirmNewPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, VALIDATION_MESSAGES.required),
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, VALIDATION_MESSAGES.required),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: VALIDATION_MESSAGES.passwordsMismatch,
    path: ["confirmPassword"],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * FR-Auth-2. `currentPin` is deliberately always shown/collected in the UI
 * (never conditionally hidden based on "do I already have one" state) - the
 * backend has no GET endpoint to check that ahead of time, so a single form
 * works for both first-time set and change: leave `currentPin` blank the
 * first time, the backend's own validation (not this schema) is what
 * actually enforces whether one was required.
 */
export const setTransactionPinSchema = z
  .object({
    currentPassword: z.string().min(1, VALIDATION_MESSAGES.required),
    currentPin: z
      .string()
      .regex(/^\d{4}$/, VALIDATION_MESSAGES.currentPinRequired)
      .optional()
      .or(z.literal("")),
    pin: z.string().regex(/^\d{4}$/, VALIDATION_MESSAGES.pinInvalid),
    confirmPin: z.string().min(1, VALIDATION_MESSAGES.required),
  })
  .refine((data) => data.pin === data.confirmPin, {
    message: VALIDATION_MESSAGES.pinsMismatch,
    path: ["confirmPin"],
  });
export type SetTransactionPinInput = z.infer<typeof setTransactionPinSchema>;

/**
 * FR-5a's "join an existing business" signup variant - no email field: the
 * backend derives it from the invite token (AcceptInviteRequest has no email
 * param either), so asking for it here would just be an unused input.
 */
export const acceptInviteSchema = z.object({
  token: z.string().min(1),
  firstName: z.string().min(1, VALIDATION_MESSAGES.required),
  middleName: z.string().optional(),
  lastName: z.string().min(1, VALIDATION_MESSAGES.required),
  phoneNo: phoneNoSchema,
  password: strongPasswordSchema,
});
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
