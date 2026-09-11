"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordInput } from "@napayment/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useResetPassword } from "@/hooks/use-auth";

export function ResetPasswordForm() {
  const reset = useResetPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  return (
    <div>
      <h1 className="text-xl font-semibold text-navy-900">Reset your password</h1>
      <p className="mt-1 text-sm text-navy-500">Enter the 6-digit code and your new password.</p>

      <form onSubmit={handleSubmit((values) => reset.mutate(values))} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
        </div>
        <div>
          <Label htmlFor="token">6-digit code</Label>
          <Input id="token" maxLength={6} {...register("token")} />
          {errors.token && <p className="mt-1 text-xs text-danger">{errors.token.message}</p>}
        </div>
        <div>
          <Label htmlFor="newPassword">New password</Label>
          <PasswordInput id="newPassword" {...register("newPassword")} />
          {errors.newPassword && <p className="mt-1 text-xs text-danger">{errors.newPassword.message}</p>}
        </div>
        <Button type="submit" className="w-full" loading={reset.isPending}>
          Reset password
        </Button>
      </form>
    </div>
  );
}
