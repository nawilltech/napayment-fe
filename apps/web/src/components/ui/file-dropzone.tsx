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
          "flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
          dragging ? "border-navy-500 bg-navy-50" : "border-border hover:border-navy-300",
          uploaded && "border-success/40 bg-success-surface",
        )}
      >
        {uploaded ? (
          <>
            <CheckCircle2 className="size-6 text-success" />
            <p className="text-sm font-medium text-navy-800">{uploaded.fileName}</p>
            <p className="text-xs text-navy-500">{(uploaded.sizeBytes / 1024).toFixed(0)} KB · click to replace</p>
          </>
        ) : (
          <>
            <UploadCloud className="size-6 text-navy-400" />
            <p className="text-sm font-medium text-navy-800">{label}</p>
            {hint && <p className="text-xs text-navy-500">{hint}</p>}
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
