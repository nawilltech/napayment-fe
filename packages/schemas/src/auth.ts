import { z } from "zod";

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

export const individualSignupSchema = z.object({
  firstName: z.string().min(1, "Required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Enter a valid email"),
  phoneNo: z.string().min(10, "Enter a valid phone number"),
  password: strongPasswordSchema,
});

export const businessSignupSchema = individualSignupSchema.extend({
  businessName: z.string().min(2, "Required"),
  cacNumber: z
    .string()
    .min(1, "Required")
    .regex(/^(RC|BN|IT)\d{4,10}$/i, "Format like RC1234567"),
});

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

export const resetPasswordSchema = z.object({
  email: z.string().email("Enter a valid email"),
  token: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
  newPassword: strongPasswordSchema,
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
  phoneNo: z.string().min(10, "Enter a valid phone number"),
  password: strongPasswordSchema,
});
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
