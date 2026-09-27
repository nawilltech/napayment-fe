import type { LucideProps } from "lucide-react";
import type { IconName } from "@napayment/ui-tokens";
import { ICONS } from "../lib/icons";

/** A shared-vocabulary icon, e.g. <Icon name="settings" />. Decorative by default. */
export function Icon({ name, ...props }: { name: IconName } & LucideProps) {
  const Glyph = ICONS[name];
  return <Glyph aria-hidden="true" {...props} />;
}
