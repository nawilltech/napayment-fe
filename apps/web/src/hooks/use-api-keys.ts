"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ApiKeyGeneratedResponse, ApiKeyResponse, PageResponse } from "@napayment/api-client";
import { api } from "@/lib/api";

export function useApiKeys() {
  return useQuery({
    queryKey: ["api-keys"],
    queryFn: () => api.get<PageResponse<ApiKeyResponse>>("/api/api-keys"),
  });
}

export function useGenerateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<ApiKeyGeneratedResponse>("/api/api-keys"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useRegenerateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<ApiKeyGeneratedResponse>("/api/api-keys/regenerate"),
    onSuccess: () => {
      toast.success("API key regenerated — the old key stopped working immediately.");
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useIpWhitelist() {
  return useQuery({
    queryKey: ["ip-whitelist"],
    queryFn: () => api.get<PageResponse<string>>("/api/api-keys/ip-whitelist"),
  });
}

export function useAddIpWhitelist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cidr: string) => api.post("/api/api-keys/ip-whitelist", { cidr }),
    onSuccess: () => {
      toast.success("IP address whitelisted");
      queryClient.invalidateQueries({ queryKey: ["ip-whitelist"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useRemoveIpWhitelist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cidr: string) => api.delete(`/api/api-keys/ip-whitelist?cidr=${encodeURIComponent(cidr)}`),
    onSuccess: () => {
      toast.success("IP address removed");
      queryClient.invalidateQueries({ queryKey: ["ip-whitelist"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
