"use client";

import { useActionState } from "react";
import { Input } from "@napayment/ui/input";
import { Label } from "@napayment/ui/label";
import { PasswordInput } from "@napayment/ui/password-input";
import { signInAction } from "@/app/actions";
import { FormFeedback, SubmitButton } from "./form-feedback";

export function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const [state, action] = useActionState(signInAction, { error: initialError });
  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="username" required />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <PasswordInput id="password" name="password" autoComplete="current-password" required />
      </div>
      <FormFeedback state={state} />
      <SubmitButton size="lg" className="w-full">
        Sign in
      </SubmitButton>
    </form>
  );
}
