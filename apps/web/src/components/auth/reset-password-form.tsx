"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordInput } from "@napayment/schemas";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { useResetPassword } from "@/hooks/use-auth";

/**
 * Email and token arrive as query params on the link emailed to the user
 * (see AuthService#resetUrl on the backend) - they're never typed in by
 * hand, so this form only asks for the new password.
 */
export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const token = searchParams.get("token");
  const reset = useResetPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: email ?? "", token: token ?? "" },
  });

  if (!email || !token) {
    return (
      <div>
        <h1 className="text-[28px] font-bold leading-tight text-ink">Reset your password</h1>
        <Alert variant="warning" className="mt-4">
          This reset link is missing or invalid. Request a new one from the{" "}
          <Link href="/forgot-password" className="font-medium underline">
            forgot password
          </Link>{" "}
          page.
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-[28px] font-bold leading-tight text-ink">Reset your password</h1>
      <p className="mt-1.5 text-[14.5px] text-muted">Choose a new password for {email}.</p>

      <form onSubmit={handleSubmit((values) => reset.mutate(values))} className="mt-6 space-y-4">
        <input type="hidden" {...register("email")} />
        <input type="hidden" {...register("token")} />
        <div>
          <Label htmlFor="newPassword">New password</Label>
          <PasswordInput id="newPassword" {...register("newPassword")} />
          {errors.newPassword && <p className="mt-1 text-xs text-danger">{errors.newPassword.message}</p>}
        </div>
        <div>
          <Label htmlFor="confirmNewPassword">Confirm new password</Label>
          <PasswordInput id="confirmNewPassword" {...register("confirmNewPassword")} />
          {errors.confirmNewPassword && (
            <p className="mt-1 text-xs text-danger">{errors.confirmNewPassword.message}</p>
          )}
        </div>
        <Button type="submit" size="lg" className="w-full" loading={reset.isPending}>
          Reset password
        </Button>
      </form>
    </div>
  );
}
