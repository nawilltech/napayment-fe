import { SettingsTabs } from "@/components/settings/settings-tabs";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-navy-900">Settings</h1>
      <SettingsTabs />
      <div className="max-w-2xl pt-6">{children}</div>
    </div>
  );
}
