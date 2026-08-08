import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2 } from "lucide-react";

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
        <Button render={<Link href="/admin/agents/new" />}>
          <Plus className="size-4" />
          Add agent
        </Button>
      </div>

      {agents.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
          <Building2 className="size-8 opacity-40" />
          <p>No agents yet. Add the first agency to get started.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Link key={agent.id} href={`/admin/agents/${agent.id}`}>
              <Card className="flex flex-col gap-3 p-4 transition-colors hover:border-primary/50">
                <div className="flex items-start gap-3">
                  {agent.logoUrl ? (
                    <Image
                      src={agent.logoUrl}
                      alt=""
                      width={44}
                      height={44}
                      className="size-11 shrink-0 rounded-lg border object-contain p-1"
                    />
                  ) : (
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-muted-foreground">
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
                    className={`mt-1 size-2 shrink-0 rounded-full ${agent.active ? "bg-success" : "bg-muted-foreground/40"}`}
                    title={agent.active ? "Active" : "Inactive"}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>@{agent.username}</span>
                  <span>·</span>
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
