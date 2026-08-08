import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AgentForm } from "../../agent-form";

export default async function EditAgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agent = await prisma.agent.findUnique({ where: { id } });
  if (!agent) notFound();

  return (
    <AgentForm
      agentId={agent.id}
      defaultValues={{
        name: agent.name,
        company: agent.company,
        country: agent.country,
        username: agent.username,
        password: "",
        active: agent.active,
      }}
    />
  );
}
