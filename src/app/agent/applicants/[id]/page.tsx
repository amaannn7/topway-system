import { notFound } from "next/navigation";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAgentApplicant } from "@/lib/agent-applicant-view";
import { deriveLifecycleStatus } from "@/lib/pipeline-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicantStatusBadge } from "@/app/admin/applicants/applicant-status-badge";
import { LifecycleStatusBadge } from "@/app/admin/applicants/lifecycle-status-badge";
import { DownloadCvButton } from "../download-cv-button";
import { PdfPreviewDialog } from "@/components/pdf-preview-dialog";
import { UserRound, IdCard, Briefcase } from "lucide-react";
import { DisputeReportForm } from "./dispute-report-form";
import { RequestActionButton } from "./request-action-button";
import { cn } from "@/lib/utils";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
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
    <div
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary",
        className
      )}
    >
      <Icon className="size-4" />
    </div>
  );
}

function fmtDate(d: Date | null) {
  if (!d) return null;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

export default async function AgentApplicantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const applicant = await getAgentApplicant(session!.user.id, id);
  if (!applicant) notFound();

  const [assignment, pendingRequest] = await Promise.all([
    prisma.agentAssignment.findUnique({
      where: { agentId_applicantId: { agentId: session!.user.id, applicantId: id } },
      select: { agentId: true },
    }),
    prisma.agentRequest.findUnique({
      where: { agentId_applicantId: { agentId: session!.user.id, applicantId: id } },
      select: { status: true },
    }),
  ]);
  const isAssigned = !!assignment;
  const isRequested = pendingRequest?.status === "PENDING";

  const lifecycle = deriveLifecycleStatus(applicant);

  const skills = [
    ["Cleaning", applicant.skillCleaning],
    ["Washing", applicant.skillWashing],
    ["Baby sitting", applicant.skillBabysitting],
    ["Arabic cooking", applicant.skillCooking],
    ["Driving", applicant.skillDriving],
  ].filter(([, v]) => v);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {applicant.name || "(Unnamed)"}
            </h1>
            <ApplicantStatusBadge status={applicant.status} />
            {lifecycle.status !== "NOT_DEPARTED" && (
              <LifecycleStatusBadge status={lifecycle.status} />
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {applicant.role} · {applicant.contract}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isAssigned && (
            <RequestActionButton applicantId={applicant.id} requested={isRequested} />
          )}
          <PdfPreviewDialog
            pdfUrl={`/agent/applicants/${applicant.id}/cv`}
            fileName={`${applicant.name || "candidate"}-cv.pdf`}
            title={`${applicant.name || "Applicant"} CV`}
          />
          <DownloadCvButton applicantId={applicant.id} applicantName={applicant.name}>
            Download CV
          </DownloadCvButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="shadow-sm lg:col-span-1">
          <CardContent className="flex flex-col items-center gap-3 pt-6">
            {applicant.headshotUrl ? (
              <Image
                src={applicant.headshotUrl}
                alt=""
                width={120}
                height={150}
                className="h-[150px] w-[120px] rounded-lg object-cover shadow-sm ring-1 ring-foreground/10"
              />
            ) : (
              <div className="flex h-[150px] w-[120px] items-center justify-center rounded-lg bg-primary/10 text-primary shadow-sm ring-1 ring-foreground/10">
                <UserRound className="size-8" />
              </div>
            )}
            {skills.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1">
                {skills.map(([label]) => (
                  <span
                    key={label as string}
                    className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <SectionIcon icon={IdCard} />
              <CardTitle className="text-sm">Personal information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 divide-y divide-border/60 sm:grid-cols-2 sm:gap-x-6 sm:divide-y-0">
              <Row label="Nationality" value={applicant.nationality} />
              <Row label="Religion" value={applicant.religion} />
              <Row label="Date of birth" value={fmtDate(applicant.dateOfBirth)} />
              <Row label="Age" value={applicant.age} />
              <Row label="Height" value={applicant.heightCm ? `${applicant.heightCm} cm` : null} />
              <Row label="Weight" value={applicant.weightKg ? `${applicant.weightKg} kg` : null} />
              <Row label="Marital status" value={applicant.maritalStatus} />
              <Row label="Children" value={applicant.children} />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <SectionIcon icon={Briefcase} className="bg-info/10 text-info" />
              <CardTitle className="text-sm">Passport</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 divide-y divide-border/60 sm:grid-cols-2 sm:gap-x-6 sm:divide-y-0">
              <Row label="Passport no." value={applicant.passportNo} />
              <Row label="Place of issue" value={applicant.passportIssuedAt} />
              <Row label="Date of issue" value={fmtDate(applicant.passportIssueDate)} />
              <Row label="Date of expiry" value={fmtDate(applicant.passportExpiryDate)} />
            </CardContent>
          </Card>

          {applicant.employmentHistory.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                <SectionIcon icon={Briefcase} className="bg-amber/15 text-amber-foreground" />
                <CardTitle className="text-sm">Employment record</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col divide-y divide-border/60">
                {applicant.employmentHistory.map((row) => (
                  <div key={row.id} className="py-2 text-sm first:pt-0">
                    <span className="font-medium text-foreground">{row.position}</span>
                    <span className="text-muted-foreground"> · {row.country} · {row.period}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {isAssigned && <DisputeReportForm applicantId={applicant.id} />}
        </div>
      </div>
    </div>
  );
}
