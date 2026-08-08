import { SettingsTabsNav } from "./settings-tabs-nav";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Branding, agent access, team accounts, and the audit log.
        </p>
      </div>
      <SettingsTabsNav />
      <div className="pt-2">{children}</div>
    </div>
  );
}
