"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@napayment/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/hooks/use-auth";

export function LoginForm() {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  return (
    <div>
      <h1 className="text-[28px] font-bold leading-tight text-ink">Log in</h1>
      <p className="mt-1.5 text-[14.5px] text-muted">Welcome back to your Business Console.</p>

      <form onSubmit={handleSubmit((values) => login.mutate(values))} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-[13px] font-semibold text-brand hover:underline">
              Forgot password?
            </Link>
          </div>
          <PasswordInput id="password" {...register("password")} />
          {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
        </div>
        <Button type="submit" size="lg" className="w-full" loading={login.isPending}>
          Log in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-brand hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
