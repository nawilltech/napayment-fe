import type { Metadata } from "next";
import { PreferencesCard } from "@napayment/ui/preferences-card";

export const metadata: Metadata = { title: "Settings — Napayment Admin" };

export default function SettingsPage() {
  return (
    <div className="max-w-3xl space-y-4">
      <h2 className="text-[15px] font-bold text-ink">Preferences</h2>
      <PreferencesCard />
    </div>
  );
}
