import type { HTMLAttributes } from "react";
import { AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva("flex items-start gap-3 rounded-[10px] border p-3.5 text-[13.5px] leading-relaxed", {
  variants: {
    variant: {
      info: "border-pending/20 bg-pending-surface text-pending",
      warning: "border-warning-line bg-warning-surface text-warning-ink",
      success: "border-success-line bg-success-surface text-success",
    },
  },
  defaultVariants: { variant: "info" },
});

const ICON = { info: Info, warning: AlertTriangle, success: CheckCircle2 };

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
