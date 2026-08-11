import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, PlaneTakeoff, Clock, Inbox, ArrowRight } from "lucide-react";
import { delaySeverity } from "@/lib/pipeline-status";
import { PIPELINE_STEPS } from "@/lib/constants/applicant";
import { cn } from "@/lib/utils";

function fmtWhen(d: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

const DELAY_STYLES = {
  ok: "bg-success/15 text-success",
  warn: "bg-warning/15 text-warning-foreground",
  late: "bg-destructive/10 text-destructive",
  none: "bg-muted text-muted-foreground",
};

const STEP_CHIP_COLORS = [
  "bg-info",
  "bg-purple",
  "bg-success",
  "bg-warning",
  "bg-amber",
  "bg-secondary",
];

export default async function AdminDashboardPage() {
  const [total, ready, inProgress, pendingRequests, recentActivity, delayed, stepCounts] =
    await Promise.all([
      prisma.applicant.count(),
      // "Ready to travel": all 6 pipeline steps complete and a ticket date set.
      prisma.applicant.count({
        where: {
          ticketDate: { not: null },
          pipelineSteps: { every: { completed: true } },
        },
      }),
      prisma.applicant.count({
        where: {
          pipelineStatus: "ACTIVE",
          pipelineSteps: { some: { completed: true } },
        },
      }),
      prisma.agentRequest.count({ where: { status: "PENDING" } }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 4,
        include: { adminUser: { select: { name: true } } },
      }),
      // Applicants whose Musaned clock has been running longest without a
      // ticket date yet — the legacy admin/agent tables surfaced this as a
      // colored delay pill per row; here it's a dashboard callout instead.
      prisma.applicant.findMany({
        where: { musanedDate: { not: null }, ticketDate: null, pipelineStatus: "ACTIVE" },
        orderBy: { musanedDate: "asc" },
        take: 5,
        select: { id: true, name: true, musanedDate: true },
      }),
      prisma.pipelineStep.groupBy({
        by: ["key"],
        where: { completed: true },
        _count: { _all: true },
      }),
    ]);

  const stepCountByKey = new Map(stepCounts.map((s) => [s.key, s._count._all]));

  const stats = [
    { label: "Total applicants", value: total, icon: Users, chip: "bg-info/10 text-info" },
    {
      label: "Ready to travel",
      value: ready,
      icon: PlaneTakeoff,
      chip: "bg-success/15 text-success",
    },
    {
      label: "In progress",
      value: inProgress,
      icon: Clock,
      chip: "bg-warning/15 text-warning-foreground",
    },
    {
      label: "Pending requests",
      value: pendingRequests,
      icon: Inbox,
      chip: "bg-purple/10 text-purple",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of applicant processing and agent activity.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="shadow-sm transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4">
              <div
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-xl",
                  stat.chip
                )}
              >
                <stat.icon className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-semibold tabular-nums">{stat.value}</p>
                <p className="truncate text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Pipeline breakdown</CardTitle>
          <CardDescription>How many applicants have completed each stage.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {PIPELINE_STEPS.map((step, i) => {
            const done = stepCountByKey.get(step.key) ?? 0;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
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
                  {done}/{total}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">Longest-waiting applicants</CardTitle>
            <CardDescription>Musaned started, no ticket date yet.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            {delayed.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing waiting. Good sign.</p>
            ) : (
              delayed.map((a) => {
                const { days, severity } = delaySeverity(a.musanedDate);
                return (
                  <Link
                    key={a.id}
                    href={`/admin/applicants/${a.id}/pipeline`}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <span className="truncate">{a.name || "(Unnamed)"}</span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
                        DELAY_STYLES[severity]
                      )}
                    >
                      {days}d
                    </span>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <CardTitle className="text-sm">Recent activity</CardTitle>
              <CardDescription>A few of the latest changes.</CardDescription>
            </div>
            <Link
              href="/admin/settings/audit-log"
              className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View all
              <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              recentActivity.map((entry, i) => (
                <div
                  key={entry.id}
                  className={cn(
                    "flex flex-col gap-0.5 py-2.5",
                    i > 0 && "border-t border-border/60"
                  )}
                >
                  <p className="text-sm leading-snug break-words">{entry.summary}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.adminUser?.name ?? "System"} · {fmtWhen(entry.createdAt)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
