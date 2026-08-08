import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deriveStatus, STATUS_LABEL, type DerivedStatus } from "@/lib/pipeline-status";
import { ApplicantStatusBadge } from "./applicant-status-badge";
import { ApplicantsToolbar } from "./applicants-toolbar";
import { UserRound } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";

export default async function AdminApplicantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; category?: string }>;
}) {
  const { q, status, category } = await searchParams;

  const where: Prisma.ApplicantWhereInput = {
    ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    ...(category ? { workerCategory: category as never } : {}),
  };

  const applicants = await prisma.applicant.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      pipelineSteps: { select: { completed: true } },
      photos: { where: { kind: "HEADSHOT" }, select: { url: true }, take: 1 },
    },
  });

  const withStatus = applicants
    .map((a) => ({ ...a, status: deriveStatus(a) }))
    .filter((a) => !status || a.status === status);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Applicants</h1>
          <p className="text-sm text-muted-foreground">
            {applicants.length} applicant{applicants.length === 1 ? "" : "s"} total
          </p>
        </div>
      </div>

      <ApplicantsToolbar />

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Nationality</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Steps</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {withStatus.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                  {applicants.length === 0
                    ? "No applicants yet. Create the first profile to get started."
                    : "No applicants match the current filters."}
                </TableCell>
              </TableRow>
            )}
            {withStatus.map((a) => {
              const done = a.pipelineSteps.filter((s) => s.completed).length;
              return (
                <TableRow key={a.id} className="cursor-pointer">
                  <TableCell>
                    {a.photos[0]?.url ? (
                      <Image
                        src={a.photos[0].url}
                        alt=""
                        width={32}
                        height={40}
                        className="h-10 w-8 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-8 items-center justify-center rounded bg-muted text-muted-foreground">
                        <UserRound className="size-4" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/applicants/${a.id}`}
                      className="font-medium hover:underline"
                    >
                      {a.name || "(Unnamed)"}
                    </Link>
                    {a.refNo && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        Ref {a.refNo}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{a.role}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {a.nationality || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {a.age ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {done}/6
                  </TableCell>
                  <TableCell>
                    <ApplicantStatusBadge status={a.status as DerivedStatus} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
