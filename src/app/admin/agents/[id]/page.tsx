import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoPanel } from "./logo-panel";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1 text-sm">
      <span className="min-w-32 shrink-0 font-medium text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

export default async function AgentOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agent = await prisma.agent.findUnique({
    where: { id },
    include: { _count: { select: { assignments: true, requests: true } } },
  });
  if (!agent) notFound();

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardContent className="flex flex-col items-center gap-3 pt-6">
          <LogoPanel agentId={agent.id} logoUrl={agent.logoUrl} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Account details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2">
            <Row label="Contact" value={agent.name} />
            <Row label="Country" value={agent.country} />
            <Row label="Username" value={`@${agent.username}`} />
            <Row label="Status" value={agent.active ? "Active" : "Inactive"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Activity</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2">
            <Row label="Assigned profiles" value={agent._count.assignments} />
            <Row label="Pending requests" value={agent._count.requests} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
