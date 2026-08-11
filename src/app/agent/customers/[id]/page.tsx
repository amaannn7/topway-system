import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ShareList } from "./share-list";

export default async function CustomerSharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const agentId = session!.user.id;

  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer || customer.agentId !== agentId) notFound();

  const [assignments, shares] = await Promise.all([
    prisma.agentAssignment.findMany({
      where: { agentId },
      orderBy: { applicant: { createdAt: "asc" } },
      include: {
        applicant: {
          select: {
            id: true,
            name: true,
            role: true,
            photos: { where: { kind: "HEADSHOT" }, select: { url: true }, take: 1 },
          },
        },
      },
    }),
    prisma.customerShare.findMany({ where: { customerId: id }, select: { applicantId: true } }),
  ]);

  const applicants = assignments.map((a) => ({
    id: a.applicant.id,
    name: a.applicant.name,
    role: a.applicant.role,
    headshotUrl: a.applicant.photos[0]?.url ?? null,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Share with {customer.name}</h1>
        <p className="text-sm text-muted-foreground">
          Choose which of your assigned candidate profiles this customer can view.
        </p>
      </div>
      <ShareList
        customerId={customer.id}
        applicants={applicants}
        initiallySharedIds={shares.map((s) => s.applicantId)}
      />
    </div>
  );
}
