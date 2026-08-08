import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function AgentBrowsePage() {
  const settings = await prisma.orgSettings.findUnique({
    where: { id: "singleton" },
  });
  if (!settings?.allowAgentBrowse) redirect("/agent/dashboard");

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold tracking-tight">Browse &amp; Request</h1>
      <p className="text-sm text-muted-foreground">
        Unassigned, unsent profiles you can request access to — coming next.
      </p>
    </div>
  );
}
