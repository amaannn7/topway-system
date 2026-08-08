import { prisma } from "@/lib/prisma";
import { AgentAccessToggle } from "./agent-access-toggle";

export default async function AdminSettingsPage() {
  const settings = await prisma.orgSettings.findUnique({ where: { id: "singleton" } });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Branding, agent access, team accounts, and audit log.
        </p>
      </div>

      <AgentAccessToggle initialValue={settings?.allowAgentBrowse ?? false} />

      <p className="text-sm text-muted-foreground">
        Branding, team accounts, and the audit log are coming next.
      </p>
    </div>
  );
}
