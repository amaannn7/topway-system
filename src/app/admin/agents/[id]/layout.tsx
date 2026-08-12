import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AgentTabsNav } from "./agent-tabs-nav";
import { DeleteAgentButton } from "./delete-agent-button";

export default async function AgentDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agent = await prisma.agent.findUnique({
    where: { id },
    select: { id: true, company: true, name: true, active: true },
  });
  if (!agent) notFound();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 ring-1 ring-primary/10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{agent.company}</h1>
            <span
              className={`size-2 rounded-full ${agent.active ? "bg-success" : "bg-muted-foreground/40"}`}
              title={agent.active ? "Active" : "Inactive"}
            />
          </div>
          <p className="text-sm text-muted-foreground">{agent.name}</p>
        </div>
        <DeleteAgentButton agentId={agent.id} company={agent.company} />
      </div>

      <AgentTabsNav agentId={agent.id} />

      <div className="pt-2">{children}</div>
    </div>
  );
}
