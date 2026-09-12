import { z } from "zod";

/**
 * A deliberately small, curated list rather than all ~246 countries the
 * backend's reference-data seeds (doc 2 §4.2's Countries table has no dial
 * code column anyway, so this can't be sourced from it). Nigeria is the
 * default and only market at MVP (doc 1 §1.4); Ghana/Kenya/South Africa are
 * the Sub-Saharan expansion markets the backend spec itself names. A couple
 * of common international codes are included so the picker isn't unusably
 * narrow for anyone else testing this.
 */
export const COUNTRY_CALLING_CODES = [
  { iso2: "NG", name: "Nigeria", dialCode: "+234", localLength: 10 },
  { iso2: "GH", name: "Ghana", dialCode: "+233", localLength: 9 },
  { iso2: "KE", name: "Kenya", dialCode: "+254", localLength: 9 },
  { iso2: "ZA", name: "South Africa", dialCode: "+27", localLength: 9 },
  { iso2: "GB", name: "United Kingdom", dialCode: "+44", localLength: 10 },
  { iso2: "US", name: "United States", dialCode: "+1", localLength: 10 },
] as const;

export type CountryCallingCode = (typeof COUNTRY_CALLING_CODES)[number];

export const DEFAULT_CALLING_CODE = COUNTRY_CALLING_CODES[0]; // Nigeria

/**
 * Validates the final, combined value (dial code + local digits, e.g.
 * "+2348012345678") that PhoneInput produces - not what the user types into
 * the local-number half alone. Loose E.164 shape: a `+`, then 7-15 digits
 * total, first digit non-zero.
 */
export const phoneNoSchema = z
  .string()
  .regex(/^\+[1-9]\d{6,14}$/, "Enter a valid phone number");

/** Strips everything but digits, and a leading national trunk "0" (0801... -> 801...). */
export function normalizeLocalNumber(raw: string): string {
  const digitsOnly = raw.replace(/\D/g, "");
  return digitsOnly.replace(/^0+/, "");
}
