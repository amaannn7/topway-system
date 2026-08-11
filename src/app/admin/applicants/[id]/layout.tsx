import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deriveStatus, deriveLifecycleStatus } from "@/lib/pipeline-status";
import { ApplicantStatusBadge } from "../applicant-status-badge";
import { LifecycleStatusBadge } from "../lifecycle-status-badge";
import { ApplicantTabsNav } from "./applicant-tabs-nav";
import { DeleteApplicantButton } from "./delete-applicant-button";
import { PdfPreviewDialog } from "@/components/pdf-preview-dialog";

export default async function ApplicantDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const applicant = await prisma.applicant.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      role: true,
      pipelineStatus: true,
      ticketDate: true,
      departureDate: true,
      destinationCountry: true,
      pipelineSteps: { select: { completed: true } },
    },
  });
  if (!applicant) notFound();

  const status = deriveStatus(applicant);
  const lifecycle = deriveLifecycleStatus(applicant);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {applicant.name || "(Unnamed)"}
            </h1>
            <ApplicantStatusBadge status={status} />
            {lifecycle.status !== "NOT_DEPARTED" && (
              <LifecycleStatusBadge status={lifecycle.status} />
            )}
          </div>
          <p className="text-sm text-muted-foreground">{applicant.role}</p>
        </div>
        <div className="flex gap-2">
          <PdfPreviewDialog
            pdfUrl={`/admin/applicants/${applicant.id}/cv`}
            fileName={`${applicant.name || "candidate"}-cv.pdf`}
            title={`${applicant.name || "Applicant"} CV`}
            triggerLabel="Preview CV"
          />
          <DeleteApplicantButton applicantId={applicant.id} name={applicant.name} />
        </div>
      </div>

      <ApplicantTabsNav applicantId={applicant.id} />

      <div className="pt-2">{children}</div>
    </div>
  );
}
