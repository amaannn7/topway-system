import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Inbox } from "lucide-react";
import { RequestRow } from "./request-row";

export default async function AdminRequestsPage() {
  const requests = await prisma.agentRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { requestedAt: "asc" },
    include: {
      agent: { select: { company: true } },
      applicant: {
        select: {
          name: true,
          role: true,
          photos: { where: { kind: "HEADSHOT" }, select: { url: true }, take: 1 },
        },
      },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Requests</h1>
        <p className="text-sm text-muted-foreground">
          Profiles that agents have asked to access via Browse &amp; Request.
        </p>
      </div>

      {requests.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground shadow-sm">
          <div className="flex size-14 items-center justify-center rounded-full bg-warning/15 text-warning-foreground">
            <Inbox className="size-6" />
          </div>
          <p>No pending requests.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2.5">
          {requests.map((r) => (
            <RequestRow
              key={r.id}
              request={{
                id: r.id,
                requestedAt: r.requestedAt.toISOString(),
                agentCompany: r.agent.company,
                applicantName: r.applicant.name,
                applicantRole: r.applicant.role,
                headshotUrl: r.applicant.photos[0]?.url ?? null,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
