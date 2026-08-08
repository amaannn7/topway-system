import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AssignmentList } from "./assignment-list";

export default async function AgentAssignedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agent = await prisma.agent.findUnique({
    where: { id },
    include: {
      assignments: { select: { applicantId: true } },
      requests: { where: { status: "PENDING" }, select: { applicantId: true } },
    },
  });
  if (!agent) notFound();

  const assignedIds = new Set(agent.assignments.map((a) => a.applicantId));
  const pendingIds = new Set(agent.requests.map((r) => r.applicantId));

  const applicants = await prisma.applicant.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      role: true,
      photos: { where: { kind: "HEADSHOT" }, select: { url: true }, take: 1 },
    },
  });

  const rows = applicants
    .map((a) => ({
      id: a.id,
      name: a.name,
      role: a.role,
      headshotUrl: a.photos[0]?.url ?? null,
      isPending: pendingIds.has(a.id),
    }))
    // Pending-unassigned first, then everyone else — mirrors the legacy
    // assign-modal sort so admin sees new requests without scrolling.
    .sort((a, b) => {
      const aPending = a.isPending && !assignedIds.has(a.id);
      const bPending = b.isPending && !assignedIds.has(b.id);
      return Number(bPending) - Number(aPending);
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Assigned profiles</CardTitle>
        <CardDescription>
          Select which applicant profiles this agent can view and download.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AssignmentList
          agentId={agent.id}
          applicants={rows}
          initiallyAssignedIds={[...assignedIds]}
        />
      </CardContent>
    </Card>
  );
}
