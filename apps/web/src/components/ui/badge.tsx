import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", {
  variants: {
    variant: {
      neutral: "bg-navy-50 text-navy-600",
      success: "bg-success-surface text-success",
      warning: "bg-warning-surface text-warning",
      danger: "bg-danger-surface text-danger",
      pending: "bg-pending-surface text-pending",
    },
  },
  defaultVariants: { variant: "neutral" },
});

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

const STATUS_VARIANT: Record<string, BadgeProps["variant"]> = {
  ACTIVE: "success",
  VERIFIED: "success",
  PAID: "success",
  COMPLETED: "success",
  ACCEPTED: "success",
  PENDING: "pending",
  PENDING_REVIEW: "pending",
  PROCESSING: "pending",
  INACTIVE: "neutral",
  NOT_STARTED: "neutral",
  EXPIRED: "warning",
  ON_HOLD: "warning",
  FAILED: "danger",
  REJECTED: "danger",
  REVOKED: "danger",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={STATUS_VARIANT[status] ?? "neutral"}>
      {status.replaceAll("_", " ").toLowerCase()}
    </Badge>
  );
}
