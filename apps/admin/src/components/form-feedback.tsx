"use client";

import { useFormStatus } from "react-dom";
import type { ActionState } from "@napayment/bff/actions";
import { Alert } from "@napayment/ui/alert";
import { Button, type ButtonProps } from "@napayment/ui/button";

/** Submit button that shows the form's pending state. */
export function SubmitButton(props: Omit<ButtonProps, "type" | "loading">) {
  const { pending } = useFormStatus();
  return <Button type="submit" loading={pending} {...props} />;
}

/** A server action's outcome under its form. */
export function FormFeedback({ state, success }: { state: ActionState; success?: string }) {
  if (state.error) return <Alert variant="warning">{state.error}</Alert>;
  const message = state.message ?? success;
  if (state.ok && message) return <Alert variant="success">{message}</Alert>;
  return null;
}
