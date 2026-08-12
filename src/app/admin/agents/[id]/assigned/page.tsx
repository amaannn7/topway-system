import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
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
    orderBy: { createdAt: "asc" },
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
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Users className="size-4.5" />
        </div>
        <div>
          <CardTitle className="text-sm">Assigned profiles</CardTitle>
          <CardDescription>
            Select which applicant profiles this agent can view and download.
          </CardDescription>
        </div>
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
