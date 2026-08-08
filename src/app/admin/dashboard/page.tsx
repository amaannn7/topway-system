import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, PlaneTakeoff, Clock, Inbox } from "lucide-react";
import { delaySeverity } from "@/lib/pipeline-status";
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

export default async function AdminDashboardPage() {
  const [total, ready, inProgress, pendingRequests, recentActivity, delayed] = await Promise.all([
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
      take: 8,
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
  ]);

  const stats = [
    { label: "Total applicants", value: total, icon: Users },
    { label: "Ready to travel", value: ready, icon: PlaneTakeoff },
    { label: "In progress", value: inProgress, icon: Clock },
    { label: "Pending requests", value: pendingRequests, icon: Inbox },
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Longest-waiting applicants</CardTitle>
            <CardDescription>Musaned started, no ticket date yet.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            {delayed.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing waiting — good sign.</p>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent activity</CardTitle>
            <CardDescription>Latest changes across the portal.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              recentActivity.map((entry) => (
                <div key={entry.id} className="text-sm">
                  <p className="truncate">{entry.summary}</p>
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
