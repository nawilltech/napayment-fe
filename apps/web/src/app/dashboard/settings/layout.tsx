import { SettingsTabs } from "@/components/settings/settings-tabs";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {/* Tabs sit in the header band, flush with the page edges (Web 07 Settings). */}
      <div className="-mx-4 -mt-5 border-b border-line bg-paper px-4 sm:-mx-8 sm:-mt-7 sm:px-8">
        <SettingsTabs />
      </div>
      <div className="max-w-[860px] pt-6">{children}</div>
    </div>
  );
}
