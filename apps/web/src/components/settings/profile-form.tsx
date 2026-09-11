"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema, type ChangePasswordInput } from "@napayment/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useChangePassword, useMe } from "@/hooks/use-auth";

export function ProfileForm() {
  const { data: me } = useMe();
  const changePassword = useChangePassword();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema) });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Full name</Label>
            <Input disabled value={me ? `${me.firstName} ${me.lastName}` : ""} />
          </div>
          <div>
            <Label>Email</Label>
            <Input disabled value={me?.email ?? ""} />
          </div>
          <div>
            <Label>Phone number</Label>
            <Input disabled value={me?.phoneNo ?? ""} />
          </div>
          <div>
            <Label>Business</Label>
            <Input disabled value={me?.businessName ?? "—"} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
        </CardHeader>
        <form
          onSubmit={handleSubmit((values) => changePassword.mutate(values, { onSuccess: () => reset() }))}
        >
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current password</Label>
              <PasswordInput id="currentPassword" {...register("currentPassword")} />
              {errors.currentPassword && (
                <p className="mt-1 text-xs text-danger">{errors.currentPassword.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="newPassword">New password</Label>
              <PasswordInput id="newPassword" {...register("newPassword")} />
              {errors.newPassword && <p className="mt-1 text-xs text-danger">{errors.newPassword.message}</p>}
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <PasswordInput id="confirmPassword" {...register("confirmPassword")} />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-danger">{errors.confirmPassword.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" loading={changePassword.isPending}>
              Update password
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
