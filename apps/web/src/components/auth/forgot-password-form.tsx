"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@napayment/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { useForgotPassword } from "@/hooks/use-auth";

export function ForgotPasswordForm() {
  const forgot = useForgotPassword();
  const [resetToken, setResetToken] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  return (
    <div>
      <h1 className="text-xl font-semibold text-navy-900">Forgot your password?</h1>
      <p className="mt-1 text-sm text-navy-500">We&apos;ll send a 6-digit reset code to your email.</p>

      <form
        onSubmit={handleSubmit((values) =>
          forgot.mutate(values, { onSuccess: (data) => setResetToken(data.resetToken) }),
        )}
        className="mt-6 space-y-4"
      >
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
        </div>
        <Button type="submit" className="w-full" loading={forgot.isPending}>
          Send reset code
        </Button>
      </form>

      {resetToken && (
        <Alert variant="dev" className="mt-4">
          Backend gap (doc F9): the reset code is returned directly in the API response today
          instead of being emailed (FR-Notif-1 isn&apos;t wired up yet). For this build, your code
          is: <span className="font-mono font-semibold">{resetToken}</span>
        </Alert>
      )}

      <p className="mt-6 text-center text-sm text-navy-500">
        <Link href="/login" className="font-medium text-navy-700 hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
