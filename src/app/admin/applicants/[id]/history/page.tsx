import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { HistoryPanel } from "./history-panel";

export default async function ApplicantHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const applicant = await prisma.applicant.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!applicant) notFound();

  const [disputes, remarketingRecords, currentAssignment] = await Promise.all([
    prisma.dispute.findMany({
      where: { applicantId: id },
      orderBy: { reportedAt: "desc" },
      include: { reportedBy: { select: { name: true } } },
    }),
    prisma.remarketingRecord.findMany({
      where: { applicantId: id },
      orderBy: { remarketedAt: "desc" },
      include: {
        createdBy: { select: { name: true } },
        dispute: { select: { category: true } },
      },
    }),
    prisma.agentAssignment.findFirst({
      where: { applicantId: id },
      include: { agent: { select: { company: true } } },
    }),
  ]);

  const previousAgentIds = Array.from(
    new Set(remarketingRecords.map((r) => r.previousAgentId).filter((v): v is string => !!v))
  );
  const previousAgents = previousAgentIds.length
    ? await prisma.agent.findMany({
        where: { id: { in: previousAgentIds } },
        select: { id: true, company: true },
      })
    : [];
  const agentCompanyById = new Map(previousAgents.map((a) => [a.id, a.company]));

  return (
    <HistoryPanel
      applicantId={applicant.id}
      currentAgentCompany={currentAssignment?.agent.company ?? null}
      disputes={disputes.map((d) => ({
        id: d.id,
        category: d.category,
        notes: d.notes,
        reportedAt: d.reportedAt.toISOString(),
        reportedByName: d.reportedBy?.name ?? "Agent-reported",
      }))}
      remarketingRecords={remarketingRecords.map((r) => ({
        id: r.id,
        remarketedAt: r.remarketedAt.toISOString(),
        notes: r.notes,
        previousAgentCompany: r.previousAgentId
          ? (agentCompanyById.get(r.previousAgentId) ?? "(deleted agent)")
          : null,
        disputeCategory: r.dispute?.category ?? null,
        createdByName: r.createdBy?.name ?? null,
      }))}
    />
  );
}
