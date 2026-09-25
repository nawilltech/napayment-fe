"use client";

import { useRef, useState, type DragEvent } from "react";
import { CheckCircle2, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

export function FileDropzone({
  label,
  hint,
  uploaded,
  onSelect,
  accept = ".pdf,.png,.jpg,.jpeg",
}: {
  label: string;
  hint?: string;
  uploaded?: { fileName: string; sizeBytes: number } | null;
  onSelect: (file: File) => void;
  accept?: string;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) onSelect(file);
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-[10px] border-[1.5px] border-dashed p-6 text-center transition-colors",
          dragging ? "border-brand bg-brand-surface" : "border-tan bg-paper hover:border-brand",
          uploaded && "border-solid border-success-line bg-[#F3FBF6]",
        )}
      >
        {uploaded ? (
          <>
            <CheckCircle2 className="size-6 text-success" />
            <p className="font-mono text-[12.5px] text-ink">{uploaded.fileName}</p>
            <p className="text-xs text-subtle">{(uploaded.sizeBytes / 1024).toFixed(0)} KB · <span className="font-semibold text-brand">Replace</span></p>
          </>
        ) : (
          <>
            <UploadCloud className="size-6 text-subtle" />
            <p className="text-[13.5px] font-semibold text-ink">{label}</p>
            {hint && <p className="text-xs text-subtle">{hint}</p>}
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onSelect(file);
          }}
        />
      </div>
    </div>
  );
}
