"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { acceptInviteSchema, type AcceptInviteInput } from "@napayment/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { DevGapNotice } from "@/components/ui/alert";
import { useAcceptInvite } from "@/hooks/use-auth";

export function AcceptInviteForm({ token }: { token: string }) {
  const acceptInvite = useAcceptInvite();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptInviteInput>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: { token },
  });

  return (
    <div className="w-full max-w-md rounded-xl border border-navy-700 bg-surface p-6 sm:p-8">
      <h1 className="text-lg font-semibold text-navy-900">You&apos;ve been invited to Nawill Pay</h1>
      <p className="mt-1 text-sm text-navy-500">
        Complete your details to join your team&apos;s business account.
      </p>

      <DevGapNotice>
        there&apos;s no public endpoint yet to resolve an invite by token (doc F9), so this can&apos;t
        show who invited you or which role you&apos;re accepting before you submit — that&apos;s
        confirmed server-side once you create your account.
      </DevGapNotice>

      <form onSubmit={handleSubmit((values) => acceptInvite.mutate(values))} className="mt-6 space-y-4">
        <input type="hidden" {...register("token")} />
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
        <div>
          <Label htmlFor="middleName">Middle name (optional)</Label>
          <Input id="middleName" {...register("middleName")} />
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
        <Button type="submit" className="w-full" loading={acceptInvite.isPending}>
          Accept invite & create account
        </Button>
      </form>
    </div>
  );
}
