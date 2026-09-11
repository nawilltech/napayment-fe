"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  BusinessDetailsInput,
  ContactSettingsInput,
  InviteTeamMemberInput,
  KycDocumentType,
  KycStatus,
  OwnerIdentityInput,
  WebhookConfigInput,
} from "@napayment/schemas";
import { api } from "@/lib/api";

export interface OnboardingStatus {
  businessDetailsDone: boolean;
  kycSubmitted: boolean;
  teamInvited: boolean;
  webhookConfigured: boolean;
  apiKeysDone: boolean;
}

export function useOnboardingStatus() {
  return useQuery({
    queryKey: ["onboarding-status"],
    queryFn: () => api.get<OnboardingStatus>("/api/onboarding/status"),
  });
}

// ---- Business details -------------------------------------------------------

export function useBusinessDetails() {
  return useQuery({
    queryKey: ["business-details"],
    queryFn: () => api.get<BusinessDetailsInput | null>("/api/onboarding/business-details"),
  });
}

export function useSaveBusinessDetails() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BusinessDetailsInput) =>
      api.put("/api/onboarding/business-details", input),
    onSuccess: () => {
      toast.success("Business details saved");
      queryClient.invalidateQueries({ queryKey: ["business-details"] });
      queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// ---- Owner identity -----------------------------------------------------------

export function useOwnerIdentity() {
  return useQuery({
    queryKey: ["owner-identity"],
    queryFn: () => api.get<OwnerIdentityInput | null>("/api/onboarding/owner-identity"),
  });
}

export function useSaveOwnerIdentity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: OwnerIdentityInput) => api.put("/api/onboarding/owner-identity", input),
    onSuccess: () => {
      toast.success("Identity details saved");
      queryClient.invalidateQueries({ queryKey: ["owner-identity"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// ---- KYC documents --------------------------------------------------------------

export interface KycDocumentMeta {
  id: string;
  type: KycDocumentType;
  fileName: string;
  sizeBytes: number;
  uploadedAt: string;
}

export function useKycDocuments() {
  return useQuery({
    queryKey: ["kyc-documents"],
    queryFn: () => api.get<KycDocumentMeta[]>("/api/onboarding/kyc/documents"),
  });
}

export function useUploadKycDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ type, file }: { type: KycDocumentType; file: File }) => {
      const form = new FormData();
      form.set("type", type);
      form.set("file", file);
      const response = await fetch("/api/onboarding/kyc/documents", { method: "POST", body: form });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message ?? "Upload failed");
      return json as KycDocumentMeta;
    },
    onSuccess: () => {
      toast.success("Document uploaded");
      queryClient.invalidateQueries({ queryKey: ["kyc-documents"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useSubmitKyc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ status: KycStatus }>("/api/onboarding/kyc/submit"),
    onSuccess: () => {
      toast.success("KYC submitted for review");
      queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// ---- Team invites -------------------------------------------------------------

export interface Invite {
  id: string;
  email: string;
  roleTemplate: string;
  status: string;
  inviteUrl: string;
  invitedAt: string;
}

export function useInvites() {
  return useQuery({
    queryKey: ["invites"],
    queryFn: () => api.get<Invite[]>("/api/onboarding/invites"),
  });
}

export function useCreateInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: InviteTeamMemberInput) => api.post<Invite>("/api/onboarding/invites", input),
    onSuccess: () => {
      toast.success("Invite sent");
      queryClient.invalidateQueries({ queryKey: ["invites"] });
      queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useRevokeInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/onboarding/invites/${id}`),
    onSuccess: () => {
      toast.success("Invite revoked");
      queryClient.invalidateQueries({ queryKey: ["invites"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// ---- Webhook / callback URL ------------------------------------------------------

export function useWebhookConfig() {
  return useQuery({
    queryKey: ["webhook-config"],
    queryFn: () => api.get<WebhookConfigInput>("/api/onboarding/webhook-config"),
  });
}

export function useSaveWebhookConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: WebhookConfigInput) => api.put("/api/onboarding/webhook-config", input),
    onSuccess: () => {
      toast.success("Webhook settings saved");
      queryClient.invalidateQueries({ queryKey: ["webhook-config"] });
      queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// ---- Contact settings -----------------------------------------------------------

export function useContactSettings() {
  return useQuery({
    queryKey: ["contact-settings"],
    queryFn: () => api.get<ContactSettingsInput>("/api/onboarding/contact"),
  });
}

export function useSaveContactSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ContactSettingsInput) => api.put("/api/onboarding/contact", input),
    onSuccess: () => {
      toast.success("Contact settings saved");
      queryClient.invalidateQueries({ queryKey: ["contact-settings"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
