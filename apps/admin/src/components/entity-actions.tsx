"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { EntityStatus } from "@napayment/api-client";
import type { ActionState } from "@napayment/bff/actions";
import { Button, buttonVariants } from "@napayment/ui/button";
import { Icon } from "@napayment/ui/icon";
import {
  archivePaymentMethodAction,
  archiveProcessorAction,
  restorePaymentMethodAction,
  restoreProcessorAction,
  setPaymentMethodActiveAction,
  setProcessorActiveAction,
} from "@/app/actions";
import { ROUTES } from "@/lib/routes";
import { ConfirmAction } from "./confirm-action";
import { FormFeedback } from "./form-feedback";

type Kind = "processor" | "paymentMethod";

/** Copy and actions per kind - defined once for the list rows and the detail pages. */
const KINDS = {
  processor: {
    noun: "processor",
    editHref: ROUTES.paymentProcessor,
    deactivate:
      "Are you sure you want to deactivate this processor? Deactivating it will stop every business from using it until it's reactivated.",
    activate: "Businesses will be able to use it again, following their own settings or the platform default.",
    archive:
      "It will be deactivated and hidden from the processor list and every business's settings. Its transaction history is kept, and you can restore it from Archived.",
    setActive: setProcessorActiveAction,
    archiveAction: archiveProcessorAction,
    restoreAction: restoreProcessorAction,
  },
  paymentMethod: {
    noun: "payment method",
    editHref: ROUTES.paymentMethod,
    deactivate:
      "Are you sure you want to deactivate this payment method? Deactivating it will stop every processor from taking payments with it until it's reactivated.",
    activate: "Processors that offer it will be able to take payments with it again.",
    archive:
      "It will be deactivated and hidden from the payment method list and processor forms. Processors and past transactions keep referring to it, and you can restore it from Archived.",
    setActive: setPaymentMethodActiveAction,
    archiveAction: archivePaymentMethodAction,
    restoreAction: restorePaymentMethodAction,
  },
} as const;

/**
 * Edit / Deactivate or Activate / Archive (or Restore when archived) for a
 * processor or payment method. `row` = compact icon buttons with tooltips
 * for table rows (Edit opens the detail page); `page` = labelled buttons
 * for the detail page itself.
 */
export function EntityActions({
  kind,
  item,
  variant,
}: {
  kind: Kind;
  item: { id: string; name: string; status: EntityStatus; archivedAt: string | null };
  variant: "row" | "page";
}) {
  const config = KINDS[kind];
  const row = variant === "row";
  const active = item.status === "ACTIVE";
  const [state, setState] = useState<ActionState>({});
  const [restoring, startRestore] = useTransition();

  if (item.archivedAt) {
    return (
      <div className={row ? "flex justify-end" : "space-y-3"}>
        <Button
          variant={row ? "ghost" : "outline"}
          size="sm"
          className={row ? "size-8 px-0" : undefined}
          aria-label={row ? `Restore ${item.name}` : undefined}
          title={row ? `Restore ${item.name}` : undefined}
          loading={restoring}
          onClick={() => startRestore(async () => setState(await config.restoreAction(item.id)))}
        >
          {!restoring && <Icon name="restore" className="size-4" />}
          {!row && "Restore"}
        </Button>
        {!row && <FormFeedback state={state} success="Restored - it stays inactive until you activate it." />}
      </div>
    );
  }

  return (
    <div className={row ? "flex items-center justify-end gap-0.5" : "flex flex-wrap items-start gap-2"}>
      {row && (
        <Link
          href={config.editHref(item.id)}
          className={buttonVariants({ variant: "ghost", size: "sm", className: "size-8 px-0" })}
          aria-label={`Edit ${item.name}`}
          title={`Edit ${item.name}`}
        >
          <Icon name="edit" className="size-4" />
        </Link>
      )}
      <ConfirmAction
        icon={active ? "deactivate" : "activate"}
        label={active ? `Deactivate ${row ? item.name : ""}`.trim() : `Activate ${row ? item.name : ""}`.trim()}
        iconOnly={row}
        title={`${active ? "Deactivate" : "Activate"} ${item.name}?`}
        description={active ? config.deactivate : config.activate}
        confirmLabel={active ? "Deactivate" : "Activate"}
        destructive={active}
        onConfirm={(password) => config.setActive(item.id, !active, password)}
      />
      <ConfirmAction
        icon="archive"
        label={row ? `Archive ${item.name}` : "Archive"}
        iconOnly={row}
        title={`Archive ${item.name}?`}
        description={config.archive}
        confirmLabel="Archive"
        destructive
        onConfirm={(password) => config.archiveAction(item.id, password)}
      />
    </div>
  );
}
