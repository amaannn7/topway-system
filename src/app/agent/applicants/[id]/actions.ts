"use server";

import { prisma } from "@/lib/prisma";
import { requireAgent } from "@/lib/require-session";
import { logAudit } from "@/lib/audit";
import { disputeSchema } from "@/lib/validations/dispute";

// An agent reporting a dispute doesn't resolve or remarket it — that stays
// an admin action (see admin/applicants/[id]/history/actions.ts), the same
// approval boundary AgentRequest already enforces for Browse & Request.
// reportedById stays null so admin can tell this was agent-relayed rather
// than staff-logged directly.
export async function reportDispute(applicantId: string, raw: unknown) {
  const agent = await requireAgent();
  const values = disputeSchema.parse(raw);

  const assignment = await prisma.agentAssignment.findUnique({
    where: { agentId_applicantId: { agentId: agent.id, applicantId } },
  });
  if (!assignment) throw new Error("Not authorized to report on this applicant");

  const dispute = await prisma.dispute.create({
    data: {
      applicantId,
      category: values.category,
      notes: values.notes || null,
    },
  });

  await logAudit({
    adminUserId: null,
    action: "CREATE",
    entityType: "Dispute",
    entityId: dispute.id,
    summary: `Agent reported a ${values.category.replace(/_/g, " ").toLowerCase()} dispute (agentId: ${agent.id})`,
  });
}
