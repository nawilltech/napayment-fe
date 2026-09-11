"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { businessSignupSchema, individualSignupSchema } from "@napayment/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useSignup } from "@/hooks/use-auth";

type FormValues = {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phoneNo: string;
  password: string;
  businessName?: string;
  cacNumber?: string;
};

export function SignupForm() {
  const [accountType, setAccountType] = useState<"individual" | "business">("individual");
  const signup = useSignup();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>();

  function onSubmit(values: FormValues) {
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
      <h1 className="text-xl font-semibold text-navy-900">Create your account</h1>
      <p className="mt-1 text-sm text-navy-500">FR-1: individuals and businesses both onboard here.</p>

      <div className="mt-6 grid grid-cols-2 gap-2 rounded-md bg-navy-50 p-1">
        {(["individual", "business"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setAccountType(type)}
            className={cn(
              "rounded px-3 py-2 text-sm font-medium capitalize transition-colors",
              accountType === type ? "bg-surface text-navy-900 shadow-sm" : "text-navy-500",
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
          <div className="grid grid-cols-1 gap-4 rounded-md border border-border bg-navy-50 p-3 sm:grid-cols-2">
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
          <Input id="phoneNo" placeholder="0801 234 5678" {...register("phoneNo")} />
          {errors.phoneNo && <p className="mt-1 text-xs text-danger">{errors.phoneNo.message}</p>}
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" {...register("password")} />
          {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full" loading={signup.isPending}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-navy-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-navy-700 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
