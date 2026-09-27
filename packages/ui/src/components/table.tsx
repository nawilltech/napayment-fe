import type { HTMLAttributes, KeyboardEvent, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { plural } from "@napayment/format";
import { cn } from "../lib/cn";
import { Button, buttonVariants } from "./button";

/**
 * Ledger-style table pieces (Web 03 design): white card, paper header row in
 * mono caps, hairline rows, mono figures. Shared by every list in both apps
 * so they can't drift apart.
 */
export function TableCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("overflow-hidden rounded-xl border border-line bg-surface", className)} {...props} />;
}

/** Scrolls sideways inside its card rather than stretching the page. */
export function Table({ minWidth = 640, className, children }: { minWidth?: number; className?: string; children: ReactNode }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-[13.5px]" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-line bg-paper text-left font-mono text-[10.5px] uppercase tracking-[0.1em] text-subtle">
        {children}
      </tr>
    </thead>
  );
}

type Align = { align?: "right" };

export function Th({ align, className, ...props }: ThHTMLAttributes<HTMLTableCellElement> & Align) {
  return <th className={cn("px-4 py-3 font-normal first:pl-5 last:pr-5", align && "text-right", className)} {...props} />;
}

export function Td({ align, className, ...props }: TdHTMLAttributes<HTMLTableCellElement> & Align) {
  return <td className={cn("px-4 py-[11px] first:pl-5 last:pr-5", align && "text-right", className)} {...props} />;
}

/** A row; with `onActivate` it's clickable and keyboard-operable (Enter/Space). */
export function Tr({
  onActivate,
  className,
  ...props
}: HTMLAttributes<HTMLTableRowElement> & { onActivate?: () => void }) {
  const interactive = onActivate
    ? {
        onClick: onActivate,
        tabIndex: 0,
        onKeyDown: (e: KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onActivate();
          }
        },
      }
    : {};
  return (
    <tr
      className={cn(
        "border-b border-line-soft last:border-0",
        onActivate && "cursor-pointer hover:bg-paper focus-visible:bg-paper focus-visible:outline-none",
        className,
      )}
      {...interactive}
      {...props}
    />
  );
}

/** Full-width row for loading skeletons and empty states. */
export function TableMessage({ colSpan, loading, children }: { colSpan: number; loading?: boolean; children?: ReactNode }) {
  if (loading) {
    return (
      <>
        {Array.from({ length: 6 }, (_, i) => (
          <tr key={i} className="border-b border-line-soft last:border-0">
            <td colSpan={colSpan} className="px-5 py-[11px]">
              <div className="h-4 animate-pulse rounded bg-line-soft" />
            </td>
          </tr>
        ))}
      </>
    );
  }
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-12 text-center text-subtle">
        {children}
      </td>
    </tr>
  );
}

/**
 * Paper footer with "N items · page x of y" and Previous/Next. Pass
 * `onPageChange` for client state, or `hrefFor` for URL-driven server pages.
 */
export function TablePager({
  page,
  totalPages,
  totalElements,
  noun,
  onPageChange,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  totalElements: number;
  noun: string;
  onPageChange?: (page: number) => void;
  hrefFor?: (page: number) => string;
}) {
  if (totalElements === 0) return null;
  const last = Math.max(totalPages, 1);
  const step = (to: number, label: ReactNode, disabled: boolean) => {
    const className = "flex-1 sm:flex-none";
    if (hrefFor && !disabled) {
      return (
        <Link href={hrefFor(to)} className={cn(buttonVariants({ variant: "outline", size: "sm" }), className)}>
          {label}
        </Link>
      );
    }
    return (
      // No handler in link mode: server-rendered pages can't pass event handlers.
      <Button
        className={className}
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={onPageChange && (() => onPageChange(to))}
      >
        {label}
      </Button>
    );
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-paper px-4 py-3 text-[13px] text-subtle sm:px-5">
      <span>
        {plural(totalElements, noun)} · page {page + 1} of {last}
      </span>
      <div className="flex w-full items-center gap-2 sm:w-auto">
        {step(
          page - 1,
          <>
            <ChevronLeft className="size-4" />
            Previous
          </>,
          page === 0,
        )}
        {step(
          page + 1,
          <>
            Next
            <ChevronRight className="size-4" />
          </>,
          page + 1 >= last,
        )}
      </div>
    </div>
  );
}
