"use client";

import { useState, useTransition, type FormEvent } from "react";
import type { IconName } from "@napayment/ui-tokens";
import type { ActionState } from "@napayment/bff/actions";
import { Button } from "@napayment/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@napayment/ui/dialog";
import { Icon } from "@napayment/ui/icon";
import { Label } from "@napayment/ui/label";
import { PasswordInput } from "@napayment/ui/password-input";
import { FormFeedback } from "./form-feedback";

/**
 * A button that asks "are you sure?" in a modal before running a
 * consequential action. Platform-wide changes also re-confirm the staff
 * password (FR-Admin-5); wrong attempts count toward the sign-in lockout.
 * `iconOnly` renders a compact table-row button (label as tooltip and
 * accessible name).
 */
export function ConfirmAction({
  icon,
  label,
  iconOnly,
  title,
  description,
  confirmLabel,
  destructive,
  requirePassword = true,
  onConfirm,
}: {
  icon: IconName;
  label: string;
  iconOnly?: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  requirePassword?: boolean;
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
      <Button
        variant={iconOnly ? "ghost" : destructive ? "destructive" : "outline"}
        size="sm"
        className={iconOnly ? (destructive ? "size-8 px-0 text-danger hover:bg-danger-surface" : "size-8 px-0") : undefined}
        aria-label={iconOnly ? label : undefined}
        title={iconOnly ? label : undefined}
        onClick={() => {
          setState({});
          setOpen(true);
        }}
      >
        <Icon name={icon} className="size-4" />
        {!iconOnly && label}
      </Button>
      {!iconOnly && state.ok && <FormFeedback state={state} />}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={submit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            {requirePassword && (
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
            )}
            {state.error && <FormFeedback state={state} />}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant={destructive ? "destructive" : "primary"} loading={pending}>
                {confirmLabel}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
