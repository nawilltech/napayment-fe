"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import {
  inviteTeamMemberSchema,
  ROLE_TEMPLATE_META,
  ROLE_TEMPLATES,
  type InviteTeamMemberInput,
} from "@napayment/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { CopyField } from "@/components/ui/copy-field";
import { formatDate } from "@/lib/utils";
import { useCreateInvite, useInvites, useRevokeInvite } from "@/hooks/use-onboarding";

export function TeamInviteForm({ showContinue = false }: { showContinue?: boolean }) {
  const router = useRouter();
  const { data: invites } = useInvites();
  const createInvite = useCreateInvite();
  const revokeInvite = useRevokeInvite();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<InviteTeamMemberInput>({
    resolver: zodResolver(inviteTeamMemberSchema),
    defaultValues: { roleTemplate: "ADMIN" },
  });
  const roleTemplate = watch("roleTemplate");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invite a team member</CardTitle>
          <CardDescription>FR-5a: scoped staff roles, limited to your business only.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit((values) => createInvite.mutate(values, { onSuccess: () => reset() }))}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="colleague@business.com" {...register("email")} />
                {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
              </div>
              <div>
                <Label htmlFor="roleTemplate">Role</Label>
                <Select id="roleTemplate" {...register("roleTemplate")}>
                  {ROLE_TEMPLATES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_TEMPLATE_META[role].label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <p className="text-xs text-navy-500">{ROLE_TEMPLATE_META[roleTemplate ?? "ADMIN"].description}</p>
            <div>
              <Label htmlFor="message">Personal message (optional)</Label>
              <Textarea id="message" rows={2} {...register("message")} />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" loading={createInvite.isPending}>
              Send invite
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending & sent invites</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {invites?.length === 0 && <p className="text-sm text-navy-500">No invites sent yet.</p>}
          {invites?.map((invite) => (
            <div key={invite.id} className="rounded-md border border-border p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-navy-900">{invite.email}</p>
                  <p className="text-xs text-navy-500">
                    {invite.roleName} · invited {formatDate(invite.invitedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={invite.status} />
                  {invite.status === "PENDING" && (
                    <button
                      type="button"
                      onClick={() => revokeInvite.mutate(invite.id)}
                      className="text-navy-400 hover:text-danger"
                      title="Revoke invite"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              </div>
              {invite.status === "PENDING" && (
                <CopyField
                  className="mt-3"
                  value={typeof window !== "undefined" ? `${window.location.origin}${invite.inviteUrl}` : invite.inviteUrl}
                />
              )}
            </div>
          ))}
        </CardContent>
        {showContinue && (
          <CardFooter>
            <Button variant="ghost" onClick={() => router.push("/onboarding/api-keys")}>
              Skip for now
            </Button>
            <Button onClick={() => router.push("/onboarding/api-keys")}>Continue</Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
