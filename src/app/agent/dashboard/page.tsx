import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Users, PlaneTakeoff, CheckCircle2, Clock, XCircle } from "lucide-react";
import { deriveStatus } from "@/lib/pipeline-status";

export default async function AgentDashboardPage() {
  const session = await auth();
  const agentId = session!.user.id;

  const assigned = await prisma.agentAssignment.findMany({
    where: { agentId },
    select: {
      applicant: {
        select: {
          pipelineStatus: true,
          ticketDate: true,
          pipelineSteps: { select: { completed: true } },
        },
      },
    },
  });

  let ready = 0;
  let complete = 0;
  let inProgress = 0;
  let cancelled = 0;

  for (const { applicant: a } of assigned) {
    const status = deriveStatus(a);
    if (status === "READY") ready++;
    else if (status === "COMPLETE") complete++;
    else if (status === "PROGRESS") inProgress++;
    else if (status === "CANCELLED") cancelled++;
  }

  // Matches the legacy's 5-stat row (Total/Ready/Fully Processed/In
  // Progress/Cancelled) — a prior pass here dropped "Fully Processed"
  // entirely, so agents couldn't tell "done but no ticket yet" apart from
  // "still in progress."
  const stats = [
    { label: "Total", value: assigned.length, icon: Users },
    { label: "Ready to travel", value: ready, icon: PlaneTakeoff },
    { label: "Fully processed", value: complete, icon: CheckCircle2 },
    { label: "In progress", value: inProgress, icon: Clock },
    { label: "Cancelled", value: cancelled, icon: XCircle },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Applicants assigned to your agency.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
