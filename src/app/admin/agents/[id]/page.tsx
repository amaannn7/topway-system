import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Contact, Activity } from "lucide-react";
import { LogoPanel } from "./logo-panel";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function SectionIcon({
  icon: Icon,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${className}`}>
      <Icon className="size-4.5" />
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
      <Card className="shadow-sm lg:col-span-1">
        <CardContent className="flex flex-col items-center gap-3 pt-6">
          <LogoPanel agentId={agent.id} logoUrl={agent.logoUrl} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 lg:col-span-2">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <SectionIcon icon={Contact} className="bg-primary/10 text-primary" />
            <CardTitle className="text-sm">Account details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 divide-y divide-border/60 sm:grid-cols-2 sm:gap-x-6 sm:divide-y-0">
            <Row label="Contact" value={agent.name} />
            <Row label="Country" value={agent.country} />
            <Row label="Username" value={`@${agent.username}`} />
            <Row label="Status" value={agent.active ? "Active" : "Inactive"} />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <SectionIcon icon={Activity} className="bg-primary/10 text-primary" />
            <CardTitle className="text-sm">Activity</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 divide-y divide-border/60 sm:grid-cols-2 sm:gap-x-6 sm:divide-y-0">
            <Row label="Assigned profiles" value={agent._count.assignments} />
            <Row label="Pending requests" value={agent._count.requests} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
