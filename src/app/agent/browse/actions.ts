"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAgent } from "@/lib/require-session";

export async function toggleRequest(applicantId: string) {
  const agent = await requireAgent();

  const settings = await prisma.orgSettings.findUnique({ where: { id: "singleton" } });
  if (!settings?.allowAgentBrowse) throw new Error("Browse requests are disabled");

  const assigned = await prisma.agentAssignment.findUnique({
    where: { agentId_applicantId: { agentId: agent.id, applicantId } },
  });
  if (assigned) return "assigned" as const;

  const existing = await prisma.agentRequest.findUnique({
    where: { agentId_applicantId: { agentId: agent.id, applicantId } },
  });

  if (existing?.status === "PENDING") {
    await prisma.agentRequest.update({
      where: { id: existing.id },
      data: { status: "CANCELLED", resolvedAt: new Date() },
    });
    revalidatePath("/agent/browse");
    revalidatePath("/admin/requests");
    return "available" as const;
  }

  await prisma.agentRequest.upsert({
    where: { agentId_applicantId: { agentId: agent.id, applicantId } },
    update: { status: "PENDING", requestedAt: new Date(), resolvedAt: null },
    create: { agentId: agent.id, applicantId, status: "PENDING" },
  });
  revalidatePath("/agent/browse");
  revalidatePath("/admin/requests");
  return "requested" as const;
}
