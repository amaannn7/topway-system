import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, PlaneTakeoff, Clock, Inbox } from "lucide-react";

export default async function AdminDashboardPage() {
  const [total, ready, inProgress, pendingRequests] = await Promise.all([
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

      <Card>
        <CardHeader>
          <CardTitle>Getting started</CardTitle>
          <CardDescription>
            This is Phase 6 in progress — the dashboard, applicants, agents,
            requests, invoices, and settings sections are being built out one
            at a time per the Phase 2 information architecture.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
