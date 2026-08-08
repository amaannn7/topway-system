import Link from "next/link";
import Image from "next/image";
import { UserRound, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ApplicantStatusBadge } from "@/app/admin/applicants/applicant-status-badge";
import type { AgentApplicantView } from "@/lib/agent-applicant-view";
import { DownloadCvButton } from "./download-cv-button";

export function ApplicantCard({ applicant }: { applicant: AgentApplicantView }) {
  const done = applicant.pipelineSteps.filter((s) => s.completed).length;

  return (
    <Card className="flex flex-col overflow-hidden">
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
            <UserRound className="size-10 text-muted-foreground/50" />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-4">
          <p className="font-semibold">{applicant.name || "(Unnamed)"}</p>
          <p className="text-xs text-muted-foreground">{applicant.role}</p>
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
      <div className="border-t p-3">
        <DownloadCvButton applicantId={applicant.id} applicantName={applicant.name}>
          <Download className="size-4" />
          Download CV
        </DownloadCvButton>
      </div>
    </Card>
  );
}
