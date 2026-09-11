"use client";

import { useQuery } from "@tanstack/react-query";
import type { AdminDivisionResponse, CountryResponse, PageResponse } from "@napayment/api-client";
import { api } from "@/lib/api";

export function useCountries() {
  return useQuery({
    queryKey: ["countries"],
    queryFn: () => api.get<PageResponse<CountryResponse>>("/api/reference-data/countries"),
    staleTime: Infinity,
  });
}

export function useStates(countryId: string | undefined) {
  return useQuery({
    queryKey: ["states", countryId],
    queryFn: () =>
      api.get<PageResponse<AdminDivisionResponse>>(
        `/api/reference-data/countries/${countryId}/states`,
      ),
    enabled: Boolean(countryId),
    staleTime: Infinity,
  });
}
