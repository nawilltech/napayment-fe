"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

const LENGTH = 4;

/**
 * A single combined value ("1234") in, a single combined value out - same
 * composite-field shape as PhoneInput, for the same reason: plug into React
 * Hook Form via Controller, not register(), since four boxes compose into
 * one field value rather than registering independently.
 *
 * Boxed-digit entry with auto-advancing focus is the standard mobile fintech
 * PIN pattern (this UI is meant to be the template `apps/mobile` reuses
 * verbatim later) - built mobile-first even though it ships on web first.
 */
export function PinInput({
  value,
  onChange,
  onBlur,
  id,
  disabled,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  id?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: LENGTH }, (_, i) => value[i] ?? "");

  function setDigit(index: number, char: string) {
    const next = digits.slice();
    next[index] = char;
    onChange(next.join("").slice(0, LENGTH));
  }

  function handleChange(index: number, raw: string) {
    const cleaned = raw.replace(/\D/g, "");
    if (!cleaned) {
      setDigit(index, "");
      return;
    }
    // Handles both a single keystroke and a multi-digit paste landing in one box.
    const chars = cleaned.split("");
    const next = digits.slice();
    for (let i = 0; i < chars.length && index + i < LENGTH; i++) {
      next[index + i] = chars[i];
    }
    onChange(next.join("").slice(0, LENGTH));
    const lastFilled = Math.min(index + chars.length, LENGTH - 1);
    inputRefs.current[lastFilled]?.focus();
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  return (
    <div className="flex gap-2" role="group" aria-label="4-digit PIN">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          id={index === 0 ? id : undefined}
          type="password"
          inputMode="numeric"
          autoComplete="off"
          maxLength={LENGTH}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onBlur={onBlur}
          className={cn(
            "h-14 w-12 rounded-lg border border-line bg-surface text-center font-mono text-xl font-semibold text-ink",
            "focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-50",
          )}
        />
      ))}
    </div>
  );
}
