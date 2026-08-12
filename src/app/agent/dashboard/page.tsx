import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  PlaneTakeoff,
  CheckCircle2,
  Clock,
  XCircle,
  LayoutDashboard,
  TrendingUp,
} from "lucide-react";
import { deriveStatus } from "@/lib/pipeline-status";
import { PIPELINE_STEPS } from "@/lib/constants/applicant";
import { cn } from "@/lib/utils";

const STEP_CHIP_COLORS = [
  "bg-info",
  "bg-primary",
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
    {
      label: "Total",
      value: assigned.length,
      icon: Users,
      iconWrap: "bg-primary/15 text-primary",
      accent: "from-primary/10",
      ring: "hover:ring-primary/25",
    },
    {
      label: "Ready to travel",
      value: ready,
      icon: PlaneTakeoff,
      iconWrap: "bg-success/15 text-success",
      accent: "from-success/10",
      ring: "hover:ring-success/25",
    },
    {
      label: "Fully processed",
      value: complete,
      icon: CheckCircle2,
      iconWrap: "bg-info/15 text-info",
      accent: "from-info/10",
      ring: "hover:ring-info/25",
    },
    {
      label: "In progress",
      value: inProgress,
      icon: Clock,
      iconWrap: "bg-warning/20 text-warning-foreground",
      accent: "from-warning/10",
      ring: "hover:ring-warning/25",
    },
    {
      label: "Cancelled",
      value: cancelled,
      icon: XCircle,
      iconWrap: "bg-destructive/10 text-destructive",
      accent: "from-destructive/10",
      ring: "hover:ring-destructive/25",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 ring-1 ring-primary/10 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3.5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/10">
            <LayoutDashboard className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Applicants assigned to your agency.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className={cn(
              "overflow-hidden bg-gradient-to-br to-transparent shadow-sm ring-1 ring-transparent transition-all hover:-translate-y-0.5 hover:shadow-md",
              stat.accent,
              stat.ring
            )}
          >
            <CardContent className="flex items-center gap-3">
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl shadow-sm ring-1 ring-black/5",
                  stat.iconWrap
                )}
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
        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <TrendingUp className="size-4.5" />
          </div>
          <div>
            <CardTitle className="text-base">Pipeline breakdown</CardTitle>
            <CardDescription>
              How many of your assigned applicants have completed each stage.
            </CardDescription>
          </div>
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
                    className={cn("h-full rounded-full shadow-sm transition-all", STEP_CHIP_COLORS[i])}
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
