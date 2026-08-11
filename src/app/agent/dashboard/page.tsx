import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, PlaneTakeoff, CheckCircle2, Clock, XCircle } from "lucide-react";
import { deriveStatus } from "@/lib/pipeline-status";
import { PIPELINE_STEPS } from "@/lib/constants/applicant";
import { cn } from "@/lib/utils";

const STEP_CHIP_COLORS = [
  "bg-info",
  "bg-purple",
  "bg-success",
  "bg-warning",
  "bg-amber",
  "bg-secondary",
];

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
          pipelineSteps: { select: { key: true, completed: true } },
        },
      },
    },
  });

  let ready = 0;
  let complete = 0;
  let inProgress = 0;
  let cancelled = 0;
  const stepCountByKey = new Map<string, number>();

  for (const { applicant: a } of assigned) {
    const status = deriveStatus(a);
    if (status === "READY") ready++;
    else if (status === "COMPLETE") complete++;
    else if (status === "PROGRESS") inProgress++;
    else if (status === "CANCELLED") cancelled++;

    for (const step of a.pipelineSteps) {
      if (step.completed) {
        stepCountByKey.set(step.key, (stepCountByKey.get(step.key) ?? 0) + 1);
      }
    }
  }

  // Matches the legacy's 5-stat row (Total/Ready/Fully Processed/In
  // Progress/Cancelled) — a prior pass here dropped "Fully Processed"
  // entirely, so agents couldn't tell "done but no ticket yet" apart from
  // "still in progress."
  const stats = [
    { label: "Total", value: assigned.length, icon: Users, chip: "bg-purple/10 text-purple" },
    {
      label: "Ready to travel",
      value: ready,
      icon: PlaneTakeoff,
      chip: "bg-success/15 text-success",
    },
    {
      label: "Fully processed",
      value: complete,
      icon: CheckCircle2,
      chip: "bg-info/10 text-info",
    },
    {
      label: "In progress",
      value: inProgress,
      icon: Clock,
      chip: "bg-warning/15 text-warning-foreground",
    },
    {
      label: "Cancelled",
      value: cancelled,
      icon: XCircle,
      chip: "bg-destructive/10 text-destructive",
    },
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
          <Card key={stat.label} className="shadow-sm transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-3">
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${stat.chip}`}
              >
                <stat.icon className="size-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-semibold tabular-nums">{stat.value}</p>
                <p className="truncate text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Pipeline breakdown</CardTitle>
          <CardDescription>
            How many of your assigned applicants have completed each stage.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {PIPELINE_STEPS.map((step, i) => {
            const done = stepCountByKey.get(step.key) ?? 0;
            const pct = assigned.length > 0 ? Math.round((done / assigned.length) * 100) : 0;
            return (
              <div key={step.key} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-sm text-muted-foreground">{step.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full", STEP_CHIP_COLORS[i])}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                  {done}/{assigned.length}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
