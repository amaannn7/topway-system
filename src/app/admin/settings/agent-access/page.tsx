import { prisma } from "@/lib/prisma";
import { AgentAccessToggle } from "../agent-access-toggle";

export default async function AgentAccessSettingsPage() {
  const settings = await prisma.orgSettings.findUnique({ where: { id: "singleton" } });

  return <AgentAccessToggle initialValue={settings?.allowAgentBrowse ?? false} />;
}
