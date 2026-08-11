"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-session";
import { logAudit } from "@/lib/audit";
import { disputeSchema } from "@/lib/validations/dispute";

export async function logDispute(applicantId: string, raw: unknown) {
  const admin = await requireAdmin();
  const values = disputeSchema.parse(raw);

  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
    select: { name: true },
  });
  if (!applicant) throw new Error("Applicant not found");

  const dispute = await prisma.dispute.create({
    data: {
      applicantId,
      category: values.category,
      notes: values.notes || null,
      reportedById: admin.id,
    },
  });

  await logAudit({
    adminUserId: admin.id,
    action: "CREATE",
    entityType: "Dispute",
    entityId: dispute.id,
    summary: `Logged a ${values.category.replace(/_/g, " ").toLowerCase()} dispute for ${applicant.name || "(unnamed)"}`,
  });

  revalidatePath(`/admin/applicants/${applicantId}/history`);
  return dispute;
}

// Reopens a candidate for remarketing: snapshots their current agent (if
// any) onto the RemarketingRecord, clears their AgentAssignment(s) so they
// leave that agent's assigned list, and resets pipelineStatus to ACTIVE if
// it was SENT — which is enough for them to naturally reappear in
// getBrowsePool() (already filters only `pipelineStatus !== SENT`), no
// separate visibility system needed.
export async function remarketApplicant(
  applicantId: string,
  args: { disputeId?: string; notes?: string }
) {
  const admin = await requireAdmin();

  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
    select: { name: true, pipelineStatus: true },
  });
  if (!applicant) throw new Error("Applicant not found");

  const existingAssignment = await prisma.agentAssignment.findFirst({
    where: { applicantId },
    select: { agentId: true },
  });
  if (!existingAssignment) {
    throw new Error("No agent is currently assigned, so there's nothing to remarket");
  }

  await prisma.$transaction([
    prisma.remarketingRecord.create({
      data: {
        applicantId,
        previousAgentId: existingAssignment?.agentId ?? null,
        disputeId: args.disputeId ?? null,
        notes: args.notes || null,
        createdById: admin.id,
      },
    }),
    prisma.agentAssignment.deleteMany({ where: { applicantId } }),
    ...(applicant.pipelineStatus === "SENT"
      ? [
          prisma.applicant.update({
            where: { id: applicantId },
            data: { pipelineStatus: "ACTIVE" as const },
          }),
        ]
      : []),
  ]);

  await logAudit({
    adminUserId: admin.id,
    action: "STATUS_CHANGE",
    entityType: "Applicant",
    entityId: applicantId,
    summary: `Remarketed ${applicant.name || "(unnamed)"}: reopened for placement`,
  });

  revalidatePath(`/admin/applicants/${applicantId}/history`);
  revalidatePath("/admin/applicants");
  revalidatePath("/admin/agents");
}
