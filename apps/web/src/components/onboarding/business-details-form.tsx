"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { businessDetailsSchema, type BusinessDetailsInput } from "@napayment/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useMe } from "@/hooks/use-auth";
import { useBusinessDetails, useSaveBusinessDetails } from "@/hooks/use-onboarding";
import { useCountries, useStates } from "@/hooks/use-reference-data";

const BUSINESS_TYPES = [
  { value: "LIMITED_LIABILITY", label: "Limited Liability Company" },
  { value: "SOLE_PROPRIETORSHIP", label: "Sole Proprietorship" },
  { value: "PARTNERSHIP", label: "Partnership" },
  { value: "NGO", label: "NGO" },
  { value: "OTHER", label: "Other" },
];

export function BusinessDetailsForm() {
  const router = useRouter();
  const { data: me } = useMe();
  const { data: existing } = useBusinessDetails();
  const { data: countries } = useCountries();
  const save = useSaveBusinessDetails();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<BusinessDetailsInput>({ resolver: zodResolver(businessDetailsSchema) });

  const countryId = watch("countryId");
  const { data: states } = useStates(countryId);

  useEffect(() => {
    if (existing) {
      reset(existing);
    } else if (me?.businessName || me?.cacNumber) {
      reset({
        registeredName: me.businessName ?? "",
        cacNumber: me.cacNumber ?? "",
      } as BusinessDetailsInput);
    }
  }, [existing, me, reset]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business details</CardTitle>
        <CardDescription>
          This confirms the registered identity behind your virtual account (FR-1, FR-8 KYB).
        </CardDescription>
      </CardHeader>
      <form
        onSubmit={handleSubmit((values) =>
          save.mutate(values, { onSuccess: () => router.push("/onboarding/kyc") }),
        )}
      >
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="registeredName">Registered business name</Label>
            <Input id="registeredName" {...register("registeredName")} />
            {errors.registeredName && (
              <p className="mt-1 text-xs text-danger">{errors.registeredName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="cacNumber">CAC number</Label>
              <Input id="cacNumber" placeholder="RC1234567" {...register("cacNumber")} />
              {errors.cacNumber && <p className="mt-1 text-xs text-danger">{errors.cacNumber.message}</p>}
            </div>
            <div>
              <Label htmlFor="businessType">Business type</Label>
              <Select id="businessType" {...register("businessType")}>
                <option value="">Select type</option>
                {BUSINESS_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
              {errors.businessType && (
                <p className="mt-1 text-xs text-danger">{errors.businessType.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="industry">Industry</Label>
            <Input id="industry" placeholder="e.g. Retail, Logistics, Fintech" {...register("industry")} />
            {errors.industry && <p className="mt-1 text-xs text-danger">{errors.industry.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="countryId">Country</Label>
              <Select id="countryId" {...register("countryId")}>
                <option value="">Select country</option>
                {countries?.content.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              {errors.countryId && <p className="mt-1 text-xs text-danger">{errors.countryId.message}</p>}
            </div>
            <div>
              <Label htmlFor="stateId">State</Label>
              <Select id="stateId" disabled={!countryId} {...register("stateId")}>
                <option value="">Select state</option>
                {states?.content.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
              {errors.stateId && <p className="mt-1 text-xs text-danger">{errors.stateId.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="addressLine">Business address</Label>
            <Input id="addressLine" {...register("addressLine")} />
            {errors.addressLine && <p className="mt-1 text-xs text-danger">{errors.addressLine.message}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" loading={save.isPending}>
            Save & continue
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
