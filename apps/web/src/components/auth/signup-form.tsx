"use client";

import { useState } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { businessSignupSchema, individualSignupSchema, DEFAULT_CALLING_CODE } from "@napayment/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { PasswordRequirements } from "@/components/ui/password-requirements";
import { cn } from "@/lib/utils";
import { useSignup } from "@/hooks/use-auth";

type FormValues = {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phoneNo: string;
  password: string;
  confirmPassword: string;
  businessName?: string;
  cacNumber?: string;
};

export function SignupForm() {
  const [accountType, setAccountType] = useState<"individual" | "business">("individual");
  const [passwordFocused, setPasswordFocused] = useState(false);
  const signup = useSignup();
  const {
    register,
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { phoneNo: DEFAULT_CALLING_CODE.dialCode } });

  const passwordValue = watch("password") ?? "";
  const passwordField = register("password");

  function onSubmit(values: FormValues) {
    // Password/confirmPassword matching is enforced by the schema's own
    // .refine() below (mirrors the backend's SignupRequest check) - no need
    // to duplicate it here.
    const schema = accountType === "business" ? businessSignupSchema : individualSignupSchema;
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        setError(issue.path[0] as keyof FormValues, { message: issue.message });
      }
      return;
    }
    signup.mutate(parsed.data);
  }

  return (
    <div>
      <h1 className="text-[28px] font-bold leading-tight text-ink">Create your account</h1>
      <p className="mt-1.5 text-[14.5px] text-muted">Fill in your details to get onboarded.</p>

      <div className="mt-6 grid grid-cols-2 rounded-lg bg-line-soft p-1">
        {(["individual", "business"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setAccountType(type)}
            className={cn(
              "rounded-md px-3 py-[9px] text-[13.5px] capitalize transition-colors",
              accountType === type ? "bg-surface font-semibold text-ink shadow-[0_1px_2px_rgba(32,38,74,0.1)]" : "text-muted hover:text-ink",
            )}
          >
            {type}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" {...register("firstName")} />
            {errors.firstName && <p className="mt-1 text-xs text-danger">{errors.firstName.message}</p>}
          </div>
          <div>
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" {...register("lastName")} />
            {errors.lastName && <p className="mt-1 text-xs text-danger">{errors.lastName.message}</p>}
          </div>
        </div>

        {accountType === "business" && (
          <div className="grid grid-cols-1 gap-4 rounded-md border border-border bg-paper p-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="businessName">Business name</Label>
              <Input id="businessName" {...register("businessName")} />
              {errors.businessName && (
                <p className="mt-1 text-xs text-danger">{errors.businessName.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="cacNumber">CAC number</Label>
              <Input id="cacNumber" placeholder="RC1234567" {...register("cacNumber")} />
              {errors.cacNumber && <p className="mt-1 text-xs text-danger">{errors.cacNumber.message}</p>}
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
        </div>

        <div>
          <Label htmlFor="phoneNo">Phone number</Label>
          <Controller
            name="phoneNo"
            control={control}
            render={({ field }) => (
              <PhoneInput id="phoneNo" value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
            )}
          />
          {errors.phoneNo && <p className="mt-1 text-xs text-danger">{errors.phoneNo.message}</p>}
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            {...passwordField}
            onFocus={() => setPasswordFocused(true)}
            onBlur={(e) => {
              passwordField.onBlur(e);
              setPasswordFocused(false);
            }}
          />
          {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
          {(passwordFocused || passwordValue.length > 0) && (
            <PasswordRequirements password={passwordValue} />
          )}
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <PasswordInput id="confirmPassword" {...register("confirmPassword")} />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-danger">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full" loading={signup.isPending}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
