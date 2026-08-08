"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-session";
import { logAudit } from "@/lib/audit";

export async function approveRequest(requestId: string) {
  const admin = await requireAdmin();
  const request = await prisma.agentRequest.findUnique({
    where: { id: requestId },
    include: { agent: { select: { company: true } }, applicant: { select: { name: true } } },
  });
  if (!request || request.status !== "PENDING") return;

  await prisma.$transaction([
    prisma.agentAssignment.upsert({
      where: {
        agentId_applicantId: { agentId: request.agentId, applicantId: request.applicantId },
      },
      update: {},
      create: { agentId: request.agentId, applicantId: request.applicantId },
    }),
    prisma.agentRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED", resolvedAt: new Date() },
    }),
  ]);

  await logAudit({
    adminUserId: admin.id,
    action: "UPDATE",
    entityType: "AgentRequest",
    entityId: requestId,
    summary: `Approved ${request.agent.company}'s request for ${request.applicant.name || "(unnamed)"}`,
  });

  revalidatePath("/admin/requests");
  revalidatePath("/admin/agents");
}

export async function rejectRequest(requestId: string) {
  const admin = await requireAdmin();
  const request = await prisma.agentRequest.findUnique({
    where: { id: requestId },
    include: { agent: { select: { company: true } }, applicant: { select: { name: true } } },
  });
  if (!request || request.status !== "PENDING") return;

  await prisma.agentRequest.update({
    where: { id: requestId },
    data: { status: "REJECTED", resolvedAt: new Date() },
  });

  await logAudit({
    adminUserId: admin.id,
    action: "UPDATE",
    entityType: "AgentRequest",
    entityId: requestId,
    summary: `Rejected ${request.agent.company}'s request for ${request.applicant.name || "(unnamed)"}`,
  });

  revalidatePath("/admin/requests");
}
