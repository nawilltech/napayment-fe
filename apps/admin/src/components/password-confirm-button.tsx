"use client";

import { useState, useTransition, type FormEvent } from "react";
import type { ActionState } from "@napayment/bff/actions";
import { Button, type ButtonProps } from "@napayment/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@napayment/ui/dialog";
import { Label } from "@napayment/ui/label";
import { PasswordInput } from "@napayment/ui/password-input";
import { FormFeedback } from "./form-feedback";

/**
 * A button for a platform-wide change that asks the staff member to re-enter
 * their password first (FR-Admin-5). Wrong attempts count toward the normal
 * sign-in lockout, which the dialog says up front.
 */
export function PasswordConfirmButton({
  label,
  title,
  description,
  confirmLabel,
  variant = "outline",
  onConfirm,
}: {
  label: string;
  title: string;
  description: string;
  confirmLabel: string;
  variant?: ButtonProps["variant"];
  onConfirm: (password: string) => Promise<ActionState>;
}) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [state, setState] = useState<ActionState>({});
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await onConfirm(password);
      setState(result);
      if (result.ok) {
        setOpen(false);
        setPassword("");
      }
    });
  }

  return (
    <>
      <Button variant={variant} size="sm" onClick={() => { setState({}); setOpen(true); }}>
        {label}
      </Button>
      {state.ok && <FormFeedback state={state} />}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={submit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            <div>
              <Label htmlFor="confirm-password">Your password</Label>
              <PasswordInput
                id="confirm-password"
                autoComplete="current-password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="mt-1 text-xs text-subtle">Wrong attempts count toward your sign-in lockout.</p>
            </div>
            {state.error && <FormFeedback state={state} />}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant={variant === "destructive" ? "destructive" : "primary"} loading={pending}>
                {confirmLabel}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
