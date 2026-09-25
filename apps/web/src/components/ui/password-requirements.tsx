"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Mirrors packages/schemas' strongPasswordSchema regexes exactly - keep the two in sync. */
const REQUIREMENTS = [
  { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { label: "An uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "A lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { label: "A digit", test: (v: string) => /\d/.test(v) },
  { label: "A special character", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
] as const;

export function PasswordRequirements({ password }: { password: string }) {
  return (
    <ul className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
      {REQUIREMENTS.map((req) => {
        const met = req.test(password);
        return (
          <li
            key={req.label}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors",
              met ? "text-success" : "text-subtle",
            )}
          >
            <span
              className={cn(
                "flex size-3.5 shrink-0 items-center justify-center rounded-full border transition-colors",
                met ? "border-success bg-success text-white" : "border-tan bg-transparent",
              )}
            >
              {met && <Check className="size-2.5" strokeWidth={3} />}
            </span>
            {req.label}
          </li>
        );
      })}
    </ul>
  );
}
