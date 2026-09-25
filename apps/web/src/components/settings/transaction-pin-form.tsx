"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck } from "lucide-react";
import { setTransactionPinSchema, type SetTransactionPinInput } from "@napayment/schemas";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { PinInput } from "@/components/ui/pin-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { useSetTransactionPin } from "@/hooks/use-transaction-pin";

/**
 * One form handles both first-time set and change: there's no backend
 * endpoint yet to check whether a PIN already exists (docs/treasury-
 * settlements-ui-design.md §7), so "Current PIN" is always shown, labeled
 * as optional for a first-time set rather than conditionally rendered.
 */
export function TransactionPinForm() {
  const setPin = useSetTransactionPin();
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SetTransactionPinInput>({ resolver: zodResolver(setTransactionPinSchema) });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-brand" />
          <CardTitle>Transaction PIN</CardTitle>
        </div>
        <CardDescription>
          A 4-digit code required before you send a transfer - an extra layer of protection even if
          someone is signed into your account.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit((values) => setPin.mutate(values, { onSuccess: () => reset() }))}>
        <CardContent className="space-y-5">
          <Alert variant="info">
            Setting up a PIN for the first time? Leave &ldquo;Current PIN&rdquo; blank below.
          </Alert>

          <div>
            <Label htmlFor="currentPassword">Current password</Label>
            <PasswordInput id="currentPassword" {...register("currentPassword")} />
            {errors.currentPassword && (
              <p className="mt-1 text-xs text-danger">{errors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="currentPin">Current PIN (leave blank if you don&apos;t have one yet)</Label>
            <Controller
              name="currentPin"
              control={control}
              render={({ field }) => (
                <PinInput id="currentPin" value={field.value ?? ""} onChange={field.onChange} onBlur={field.onBlur} />
              )}
            />
            {errors.currentPin && <p className="mt-1 text-xs text-danger">{errors.currentPin.message}</p>}
          </div>

          <div>
            <Label htmlFor="pin">New 4-digit PIN</Label>
            <Controller
              name="pin"
              control={control}
              render={({ field }) => (
                <PinInput id="pin" value={field.value ?? ""} onChange={field.onChange} onBlur={field.onBlur} />
              )}
            />
            {errors.pin && <p className="mt-1 text-xs text-danger">{errors.pin.message}</p>}
          </div>

          <div>
            <Label htmlFor="confirmPin">Confirm new PIN</Label>
            <Controller
              name="confirmPin"
              control={control}
              render={({ field }) => (
                <PinInput
                  id="confirmPin"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
            {errors.confirmPin && <p className="mt-1 text-xs text-danger">{errors.confirmPin.message}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" loading={setPin.isPending}>
            Save PIN
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
