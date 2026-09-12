"use client";

import { useMemo } from "react";
import { COUNTRY_CALLING_CODES, DEFAULT_CALLING_CODE, normalizeLocalNumber } from "@napayment/schemas";
import { Select } from "./select";
import { Input } from "./input";

function splitValue(value: string) {
  const match = COUNTRY_CALLING_CODES.find((c) => value.startsWith(c.dialCode));
  if (match) return { dialCode: match.dialCode, local: value.slice(match.dialCode.length) };
  return { dialCode: DEFAULT_CALLING_CODE.dialCode, local: value.replace(/^\+/, "") };
}

/**
 * A single combined value ("+2348012345678") in, a single combined value
 * out - the country-code select and the local-number input are just two
 * halves of one field. Plug into React Hook Form via Controller, not
 * register(), since composing two inputs into one value needs a controlled
 * value/onChange pair rather than ref-based registration.
 */
export function PhoneInput({
  value,
  onChange,
  onBlur,
  id,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  id?: string;
  disabled?: boolean;
}) {
  const { dialCode, local } = useMemo(() => splitValue(value ?? ""), [value]);

  function emit(nextDialCode: string, nextLocal: string) {
    const normalized = normalizeLocalNumber(nextLocal);
    onChange(normalized ? `${nextDialCode}${normalized}` : "");
  }

  return (
    <div className="flex gap-2">
      <Select
        aria-label="Country code"
        className="w-32 shrink-0"
        value={dialCode}
        disabled={disabled}
        onChange={(e) => emit(e.target.value, local)}
      >
        {COUNTRY_CALLING_CODES.map((c) => (
          <option key={c.iso2} value={c.dialCode}>
            {c.iso2} {c.dialCode}
          </option>
        ))}
      </Select>
      <Input
        id={id}
        type="tel"
        inputMode="numeric"
        placeholder="801 234 5678"
        className="flex-1"
        disabled={disabled}
        value={local}
        onChange={(e) => emit(dialCode, e.target.value)}
        onBlur={onBlur}
      />
    </div>
  );
}
