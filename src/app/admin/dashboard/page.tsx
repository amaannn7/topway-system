import Link from "next/link";
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
  Clock,
  Inbox,
  ArrowRight,
  ArrowUpRight,
  Activity,
  TrendingUp,
  Repeat,
} from "lucide-react";
import { delaySeverity, deriveLifecycleStatus, LIFECYCLE_STATUS_LABEL } from "@/lib/pipeline-status";
import { PIPELINE_STEPS } from "@/lib/constants/applicant";
import { cn } from "@/lib/utils";
import { ContractCompleteNotice } from "./contract-complete-notice";

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
  "bg-primary",
  "bg-success",
  "bg-warning",
  "bg-amber",
  "bg-secondary",
];

export default async function AdminDashboardPage() {
  const [total, ready, inProgress, pendingRequests, recentActivity, delayed, stepCounts, departed] =
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
      // Post-departure lifecycle (probation/mid-contract/contract-complete)
      // isn't a stored column — it's derived from departureDate +
      // destinationCountry, so we pull the raw dates and compute in memory.
      prisma.applicant.findMany({
        where: { departureDate: { not: null } },
        select: {
          id: true,
          name: true,
          departureDate: true,
          destinationCountry: true,
          contractCompleteNotifiedAt: true,
        },
      }),
    ]);

  const stepCountByKey = new Map(stepCounts.map((s) => [s.key, s._count._all]));
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  const lifecycleCounts = {
    PROBATION_PROGRESS: 0,
    PROBATION_COMPLETE: 0,
    MID_CONTRACT: 0,
    CONTRACT_COMPLETE: 0,
  };
  const newlyContractComplete: { id: string; name: string }[] = [];
  for (const a of departed) {
    const { status } = deriveLifecycleStatus(a);
    if (status !== "NOT_DEPARTED") lifecycleCounts[status]++;
    if (status === "CONTRACT_COMPLETE" && !a.contractCompleteNotifiedAt) {
      newlyContractComplete.push({ id: a.id, name: a.name });
    }
  }
  const eligibleForRemarketing = lifecycleCounts.CONTRACT_COMPLETE;

  const stats = [
    {
      label: "Total applicants",
      value: total,
      sub: "in the pipeline",
      icon: Users,
      iconWrap: "bg-info/15 text-info",
      accent: "from-info/10",
      ring: "hover:ring-info/25",
    },
    {
      label: "Ready to travel",
      value: ready,
      sub: `${pct(ready)}% of total`,
      icon: PlaneTakeoff,
      iconWrap: "bg-success/15 text-success",
      accent: "from-success/10",
      ring: "hover:ring-success/25",
    },
    {
      label: "In progress",
      value: inProgress,
      sub: `${pct(inProgress)}% of total`,
      icon: Clock,
      iconWrap: "bg-warning/20 text-warning-foreground",
      accent: "from-warning/10",
      ring: "hover:ring-warning/25",
    },
    {
      label: "Pending requests",
      value: pendingRequests,
      sub: pendingRequests > 0 ? "needs review" : "all clear",
      icon: Inbox,
      iconWrap: "bg-primary/15 text-primary",
      accent: "from-primary/10",
      ring: "hover:ring-primary/25",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <ContractCompleteNotice applicants={newlyContractComplete} />
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 ring-1 ring-primary/10 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3.5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/10">
            <Activity className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Overview of applicant processing and agent activity.
            </p>
          </div>
        </div>
        <Link
          href="/admin/applicants"
          className="flex items-center gap-1.5 self-start rounded-full bg-background px-4 py-2 text-sm font-medium shadow-sm ring-1 ring-border transition-colors hover:bg-muted sm:self-auto"
        >
          View all applicants
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className={cn(
              "overflow-hidden bg-gradient-to-br to-transparent shadow-sm ring-1 ring-transparent transition-all hover:-translate-y-0.5 hover:shadow-md",
              stat.accent,
              stat.ring
            )}
          >
            <CardContent className="flex items-center gap-4">
              <div
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-xl shadow-sm ring-1 ring-black/5",
                  stat.iconWrap
                )}
              >
                <stat.icon className="size-5.5" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-semibold tabular-nums">{stat.value}</p>
                <p className="truncate text-sm font-medium text-foreground/80">{stat.label}</p>
                <p className="truncate text-xs text-muted-foreground">{stat.sub}</p>
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
            <CardDescription>How many applicants have completed each stage.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3.5">
          {PIPELINE_STEPS.map((step, i) => {
            const done = stepCountByKey.get(step.key) ?? 0;
            const stepPct = pct(done);
            return (
              <div key={step.key} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-sm text-muted-foreground">{step.label}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full shadow-sm transition-all", STEP_CHIP_COLORS[i])}
                    style={{ width: `${stepPct}%` }}
                  />
                </div>
                <span className="w-9 shrink-0 text-right text-xs font-medium text-muted-foreground tabular-nums">
                  {stepPct}%
                </span>
                <span className="w-16 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                  {done}/{total}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div className="flex flex-row items-center gap-3 space-y-0">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-success/15 text-success">
              <Repeat className="size-4.5" />
            </div>
            <div>
              <CardTitle className="text-base">Post-departure contract stages</CardTitle>
              <CardDescription>Probation and contract progress for departed candidates.</CardDescription>
            </div>
          </div>
          {eligibleForRemarketing > 0 && (
            <Link
              href="/admin/applicants?lifecycle=CONTRACT_COMPLETE"
              className="flex shrink-0 items-center gap-1 rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success transition-colors hover:bg-success/25"
            >
              {eligibleForRemarketing} eligible for remarketing
            </Link>
          )}
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              ["PROBATION_PROGRESS", "bg-warning/15 text-warning-foreground"],
              ["PROBATION_COMPLETE", "bg-info/10 text-info"],
              ["MID_CONTRACT", "bg-primary/10 text-primary"],
              ["CONTRACT_COMPLETE", "bg-success/15 text-success"],
            ] as const
          ).map(([key, style]) => (
            <Link
              key={key}
              href={`/admin/applicants?lifecycle=${key}`}
              className={cn(
                "flex flex-col gap-1 rounded-lg p-3 shadow-sm ring-1 ring-black/5 transition-transform hover:-translate-y-0.5",
                style
              )}
            >
              <span className="text-2xl font-semibold tabular-nums">{lifecycleCounts[key]}</span>
              <span className="text-xs font-medium">{LIFECYCLE_STATUS_LABEL[key]}</span>
            </Link>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-warning-foreground">
              <Clock className="size-4.5" />
            </div>
            <div>
              <CardTitle className="text-sm">Longest-waiting applicants</CardTitle>
              <CardDescription>Musaned started, no ticket date yet.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {delayed.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing waiting. Good sign.</p>
            ) : (
              delayed.map((a) => {
                const { days, severity } = delaySeverity(a.musanedDate);
                return (
                  <Link
                    key={a.id}
                    href={`/admin/applicants/${a.id}/pipeline`}
                    className="flex items-center justify-between rounded-lg px-2 py-2 text-sm transition-colors hover:bg-accent"
                  >
                    <span className="truncate">{a.name || "(Unnamed)"}</span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums",
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
            <div className="flex flex-row items-center gap-3 space-y-0">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-info/15 text-info">
                <Activity className="size-4.5" />
              </div>
              <div>
                <CardTitle className="text-sm">Recent activity</CardTitle>
                <CardDescription>A few of the latest changes.</CardDescription>
              </div>
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
