import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { deriveStatus, delaySeverity } from "@/lib/pipeline-status";
import { EXPERIENCE_TYPE_LABELS } from "@/lib/constants/applicant";
import { Button } from "@/components/ui/button";
import { ApplicantsToolbar } from "./applicants-toolbar";
import { ApplicantsTable, type ApplicantRow } from "./applicants-table";
import type { Prisma } from "@/generated/prisma/client";

export default async function AdminApplicantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; category?: string; experience?: string; nationality?: string }>;
}) {
  const { q, status, category, experience, nationality } = await searchParams;

  const where: Prisma.ApplicantWhereInput = {
    ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    ...(category ? { workerCategory: category as never } : {}),
    ...(experience ? { experienceType: experience as never } : {}),
    ...(nationality ? { nationality } : {}),
  };

  const [applicants, nationalitiesRaw] = await Promise.all([
    prisma.applicant.findMany({
      where,
      // Matches the legacy portal's natural order (profiles.json insertion
      // order, i.e. creation order / ascending refNo) rather than
      // newest-first.
      orderBy: { createdAt: "asc" },
      include: {
        pipelineSteps: { select: { key: true, completed: true } },
        photos: { where: { kind: "HEADSHOT" }, select: { url: true }, take: 1 },
      },
    }),
    prisma.applicant.findMany({
      where: { nationality: { not: null } },
      distinct: ["nationality"],
      select: { nationality: true },
      orderBy: { nationality: "asc" },
    }),
  ]);

  const nationalities = nationalitiesRaw
    .map((n) => n.nationality)
    .filter((n): n is string => !!n);

  const rows: ApplicantRow[] = applicants
    .map((a) => {
      const s = deriveStatus(a);
      const { days, severity } = delaySeverity(a.musanedDate);
      return {
        id: a.id,
        name: a.name,
        role: a.role,
        status: s,
        headshotUrl: a.photos[0]?.url ?? null,
        nationality: a.nationality,
        religion: a.religion,
        age: a.age,
        heightCm: a.heightCm,
        weightKg: a.weightKg,
        maritalStatus: a.maritalStatus,
        passportNo: a.passportNo,
        passportIssuedAt: a.passportIssuedAt,
        phone: a.phone,
        whatsapp: a.whatsapp,
        email: a.email,
        emergencyContact: a.emergencyContact,
        address: a.address,
        notes: a.notes,
        completedSteps: new Set(a.pipelineSteps.filter((s) => s.completed).map((s) => s.key)),
        refNo: a.refNo,
        experienceType: a.experienceType
          ? EXPERIENCE_TYPE_LABELS[a.experienceType as keyof typeof EXPERIENCE_TYPE_LABELS]
          : null,
        doneSteps: a.pipelineSteps.filter((s) => s.completed).length,
        delayDays: days,
        delaySeverity: severity,
        ticketDate: a.ticketDate,
        saudiAgentVisaDate: a.saudiAgentVisaDate,
      } satisfies ApplicantRow;
    })
    .filter((a) => !status || a.status === status);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Applicants</h1>
          <p className="text-sm text-muted-foreground">
            {applicants.length} applicant{applicants.length === 1 ? "" : "s"} total
          </p>
        </div>
        <Button size="lg" className="rounded-full px-4 shadow-sm" render={<Link href="/admin/applicants/new" />}>
          <Plus className="size-4" />
          New profile
        </Button>
      </div>

      <ApplicantsToolbar nationalities={nationalities} />

      <ApplicantsTable rows={rows} />
    </div>
  );
}
