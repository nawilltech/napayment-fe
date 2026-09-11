"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type {
  AcceptInviteInput,
  BusinessSignupInput,
  ChangePasswordInput,
  ForgotPasswordInput,
  IndividualSignupInput,
  LoginInput,
  ResetPasswordInput,
} from "@napayment/schemas";
import type { UserResponse } from "@napayment/api-client";
import { api } from "@/lib/api";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<UserResponse>("/api/auth/me"),
    retry: false,
  });
}

export function useSignup() {
  const router = useRouter();
  return useMutation({
    mutationFn: (input: IndividualSignupInput | BusinessSignupInput) =>
      api.post<{ userId: string; businessId: string; isBusiness: boolean }>(
        "/api/auth/signup",
        input,
      ),
    onSuccess: () => {
      toast.success("Account created — let's get you verified.");
      router.push("/onboarding/business");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useLogin() {
  const router = useRouter();
  return useMutation({
    mutationFn: (input: LoginInput) =>
      api.post<{ userId: string; businessId: string }>("/api/auth/login", input),
    onSuccess: () => {
      router.push("/dashboard");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/api/auth/logout"),
    onSuccess: () => {
      queryClient.clear();
      router.push("/login");
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (input: ForgotPasswordInput) =>
      api.post<{ message: string; resetToken: string | null }>(
        "/api/auth/forgot-password",
        input,
      ),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useResetPassword() {
  const router = useRouter();
  return useMutation({
    mutationFn: (input: ResetPasswordInput) =>
      api.post<{ message: string }>("/api/auth/reset-password", input),
    onSuccess: () => {
      toast.success("Password reset — sign in with your new password.");
      router.push("/login");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) =>
      api.post<{ message: string }>("/api/auth/change-password", input),
    onSuccess: () => toast.success("Password updated"),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useAcceptInvite() {
  const router = useRouter();
  return useMutation({
    mutationFn: (input: AcceptInviteInput) =>
      api.post<{ userId: string; businessId: string }>("/api/auth/accept-invite", input),
    onSuccess: () => {
      toast.success("Welcome to the team — let's get you set up.");
      router.push("/dashboard");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
