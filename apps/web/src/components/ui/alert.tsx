import type { HTMLAttributes } from "react";
import { AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva("flex items-start gap-3 rounded-md border p-4 text-sm", {
  variants: {
    variant: {
      info: "border-pending/20 bg-pending-surface text-pending",
      warning: "border-warning/20 bg-warning-surface text-warning",
      success: "border-success/20 bg-success-surface text-success",
      dev: "border-navy-200 bg-navy-50 text-navy-700",
    },
  },
  defaultVariants: { variant: "info" },
});

const ICON = { info: Info, warning: AlertTriangle, success: CheckCircle2, dev: Info };

export interface AlertProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {}

export function Alert({ className, variant = "info", children, ...props }: AlertProps) {
  const Icon = ICON[variant ?? "info"];
  return (
    <div className={cn(alertVariants({ variant }), className)} {...props}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 break-words">{children}</div>
    </div>
  );
}

/** Flags a piece of UI as working around a remaining backend gap - doc F9. */
export function DevGapNotice({ children }: { children: React.ReactNode }) {
  return (
    <Alert variant="dev">
      <span className="font-medium">Backend gap (doc F9): </span>
      {children}
    </Alert>
  );
}
