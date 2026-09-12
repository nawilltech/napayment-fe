import { z } from "zod";
import { phoneNoSchema } from "./phone";

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
  .min(8, "Must be at least 8 characters")
  .regex(/[a-z]/, "Must include a lowercase letter")
  .regex(/[A-Z]/, "Must include an uppercase letter")
  .regex(/\d/, "Must include a digit")
  .regex(/[^A-Za-z0-9]/, "Must include a special character");

/**
 * Base object fields, kept separate from the exported schemas below: Zod's
 * `.refine()` (needed for the password/confirmPassword match check, which
 * mirrors the backend's own `SignupRequest` check) returns a `ZodEffects`,
 * not a `ZodObject` - and `ZodEffects` has no `.extend()`. So the business
 * variant must `.extend()` this base *before* either variant applies its
 * own `.refine()`, not the other way around.
 */
const baseSignupFields = z.object({
  firstName: z.string().min(1, "Required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Enter a valid email"),
  phoneNo: phoneNoSchema,
  password: strongPasswordSchema,
  confirmPassword: z.string().min(1, "Required"),
});

function passwordsMatch(data: { password: string; confirmPassword: string }) {
  return data.password === data.confirmPassword;
}
const PASSWORDS_MATCH_ISSUE = { message: "Passwords don't match", path: ["confirmPassword"] };

export const individualSignupSchema = baseSignupFields.refine(passwordsMatch, PASSWORDS_MATCH_ISSUE);

export const businessSignupSchema = baseSignupFields
  .extend({
    businessName: z.string().min(2, "Required"),
    cacNumber: z
      .string()
      .min(1, "Required")
      .regex(/^(RC|BN|IT)\d{4,10}$/i, "Format like RC1234567"),
  })
  .refine(passwordsMatch, PASSWORDS_MATCH_ISSUE);

export type IndividualSignupInput = z.infer<typeof individualSignupSchema>;
export type BusinessSignupInput = z.infer<typeof businessSignupSchema>;

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email"),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    email: z.string().email("Enter a valid email"),
    token: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
    newPassword: strongPasswordSchema,
    confirmNewPassword: z.string().min(1, "Required"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords don't match",
    path: ["confirmNewPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Required"),
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * FR-5a's "join an existing business" signup variant - no email field: the
 * backend derives it from the invite token (AcceptInviteRequest has no email
 * param either), so asking for it here would just be an unused input.
 */
export const acceptInviteSchema = z.object({
  token: z.string().min(1),
  firstName: z.string().min(1, "Required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Required"),
  phoneNo: phoneNoSchema,
  password: strongPasswordSchema,
});
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
