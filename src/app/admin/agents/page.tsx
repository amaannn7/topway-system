import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function AdminAgentsPage() {
  const agents = await prisma.agent.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { assignments: true } },
      requests: { where: { status: "PENDING" }, select: { id: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agents</h1>
          <p className="text-sm text-muted-foreground">
            Foreign recruitment agencies with portal access.
          </p>
        </div>
        <Button size="lg" className="rounded-full px-4 shadow-sm" render={<Link href="/admin/agents/new" />}>
          <Plus className="size-4" />
          Add agent
        </Button>
      </div>

      {agents.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground shadow-sm">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Building2 className="size-6" />
          </div>
          <p>No agents yet. Add the first agency to get started.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Link key={agent.id} href={`/admin/agents/${agent.id}`}>
              <Card className="flex flex-col gap-3 overflow-hidden border-l-4 border-l-primary bg-gradient-to-br from-primary/5 to-transparent p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-start gap-3">
                  {agent.logoUrl ? (
                    <Image
                      src={agent.logoUrl}
                      alt=""
                      width={44}
                      height={44}
                      className="size-11 shrink-0 rounded-lg border bg-background object-contain p-1 shadow-sm"
                    />
                  ) : (
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-sm font-semibold text-primary shadow-sm ring-1 ring-primary/10">
                      {agent.company.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{agent.company}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {agent.name} · {agent.country}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "mt-1 flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                      agent.active
                        ? "bg-success/15 text-success"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        agent.active ? "bg-success" : "bg-muted-foreground/50"
                      )}
                    />
                    {agent.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-muted px-2 py-0.5 font-medium">@{agent.username}</span>
                  <span>
                    {agent._count.assignments} profile
                    {agent._count.assignments === 1 ? "" : "s"} assigned
                  </span>
                  {agent.requests.length > 0 && (
                    <Badge variant="outline" className="border-warning/40 bg-warning/10 text-warning-foreground">
                      {agent.requests.length} pending
                    </Badge>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
