import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Users, PlaneTakeoff, Clock, XCircle } from "lucide-react";

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
  let inProgress = 0;
  let cancelled = 0;

  for (const { applicant: a } of assigned) {
    const allDone = a.pipelineSteps.every((s) => s.completed);
    const anyDone = a.pipelineSteps.some((s) => s.completed);
    if (a.pipelineStatus === "CANCELLED") cancelled++;
    else if (allDone && a.ticketDate) ready++;
    else if (anyDone) inProgress++;
  }

  const stats = [
    { label: "Total", value: assigned.length, icon: Users },
    { label: "Ready to travel", value: ready, icon: PlaneTakeoff },
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

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
