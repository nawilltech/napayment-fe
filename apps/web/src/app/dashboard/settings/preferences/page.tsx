import type { Metadata } from "next";
import { PreferencesCard } from "@napayment/ui/preferences-card";

export const metadata: Metadata = { title: "Preferences — Settings — Napayment" };

export default function PreferencesSettingsPage() {
  return <PreferencesCard />;
}
