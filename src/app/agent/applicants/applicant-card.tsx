import Link from "next/link";
import Image from "next/image";
import { UserRound, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ApplicantStatusBadge } from "@/app/admin/applicants/applicant-status-badge";
import { WORKER_CATEGORY_LABELS } from "@/lib/constants/applicant";
import type { AgentApplicantView } from "@/lib/agent-applicant-view";
import { DownloadCvButton } from "./download-cv-button";
import { PdfPreviewDialog } from "@/components/pdf-preview-dialog";

const WORKER_CATEGORY_STYLES: Record<string, string> = {
  AVAILABLE_EXPERIENCED: "bg-success/15 text-success",
  AVAILABLE_INEXPERIENCED: "bg-warning/15 text-warning-foreground",
  CONTRACTED: "bg-info/15 text-info",
};

export function ApplicantCard({ applicant }: { applicant: AgentApplicantView }) {
  const done = applicant.pipelineSteps.filter((s) => s.completed).length;

  return (
    <Card className="flex flex-col overflow-hidden shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/agent/applicants/${applicant.id}`} className="flex flex-1 flex-col">
        <div className="flex h-44 items-center justify-center bg-muted">
          {applicant.headshotUrl ? (
            <Image
              src={applicant.headshotUrl}
              alt=""
              width={160}
              height={176}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserRound className="size-7" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-4">
          <p className="font-semibold">{applicant.name || "(Unnamed)"}</p>
          <p className="text-xs text-muted-foreground">{applicant.role}</p>
          {applicant.workerCategory && (
            <span
              className={`w-fit rounded-full px-2 py-0.5 text-[0.68rem] font-medium ${WORKER_CATEGORY_STYLES[applicant.workerCategory] ?? "bg-muted text-muted-foreground"}`}
            >
              {WORKER_CATEGORY_LABELS[applicant.workerCategory as keyof typeof WORKER_CATEGORY_LABELS]}
            </span>
          )}
          <div className="mt-1 flex items-center gap-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <span
                key={i}
                className={`size-2 rounded-full ${i < done ? "bg-success" : "bg-muted-foreground/25"}`}
              />
            ))}
            <span className="ml-1 text-xs text-muted-foreground">{done}/6</span>
          </div>
          <div className="mt-1">
            <ApplicantStatusBadge status={applicant.status} />
          </div>
        </div>
      </Link>
      <div className="flex gap-2 border-t p-3">
        <PdfPreviewDialog
          pdfUrl={`/agent/applicants/${applicant.id}/cv`}
          fileName={`${applicant.name || "candidate"}-cv.pdf`}
          title={`${applicant.name || "Applicant"} CV`}
        />
        <DownloadCvButton applicantId={applicant.id} applicantName={applicant.name}>
          <Download className="size-4" />
          Download
        </DownloadCvButton>
      </div>
    </Card>
  );
}
