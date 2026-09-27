"use client";

import { useRef, useState } from "react";
import { PROCESSOR_LOGO } from "@napayment/api-client";
import { initials } from "@napayment/format";
import { Button } from "@napayment/ui/button";
import { cn } from "@napayment/ui/lib/cn";
import { processLogoFile } from "@/lib/logo";

/** The processor's logo, or its initials when it has none. */
export function LogoTile({ name, logo, size = 32 }: { name: string; logo: string | null; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-surface text-[11px] font-semibold text-subtle"
      style={{ width: size, height: size }}
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element -- a stored data URL, not a remote asset to optimise
        <img src={logo} alt={`${name} logo`} className="size-full object-contain" />
      ) : (
        initials(name)
      )}
    </span>
  );
}

/**
 * Picks an image, processes it into the stored format (downscaled base64
 * data URL) and reports it; `name` also mirrors it into a hidden input so
 * it posts with a surrounding form.
 */
export function LogoPicker({
  name,
  label,
  value,
  onChange,
}: {
  name?: string;
  label: string;
  value: string | null;
  onChange: (logo: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  async function pick(file: File | undefined) {
    if (!file) return;
    setError(null);
    setProcessing(true);
    try {
      onChange(await processLogoFile(file));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProcessing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-3">
        <LogoTile name={label} logo={value} size={48} />
        <input
          ref={inputRef}
          type="file"
          accept={PROCESSOR_LOGO.mimeTypes.join(",")}
          className="sr-only"
          aria-label="Logo image"
          onChange={(e) => pick(e.target.files?.[0])}
        />
        <Button type="button" size="sm" variant="outline" loading={processing} onClick={() => inputRef.current?.click()}>
          {value ? "Replace logo" : "Upload logo"}
        </Button>
        {value && (
          <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null)}>
            Remove
          </Button>
        )}
        {name && <input type="hidden" name={name} value={value ?? ""} />}
      </div>
      <p className={cn("text-xs", error ? "text-danger" : "text-subtle")}>
        {error ?? `Optional. PNG, JPEG or WebP - resized to ${PROCESSOR_LOGO.maxDimensionPx}px before saving.`}
      </p>
    </div>
  );
}
