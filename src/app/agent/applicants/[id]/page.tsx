import { notFound } from "next/navigation";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { getAgentApplicant } from "@/lib/agent-applicant-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicantStatusBadge } from "@/app/admin/applicants/applicant-status-badge";
import { DownloadCvButton } from "../download-cv-button";
import { UserRound } from "lucide-react";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex gap-2 py-1 text-sm">
      <span className="min-w-32 shrink-0 font-medium text-muted-foreground">{label}</span>
      <span>{value}</span>
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
          </div>
          <p className="text-sm text-muted-foreground">
            {applicant.role} · {applicant.contract}
          </p>
        </div>
        <DownloadCvButton applicantId={applicant.id} applicantName={applicant.name}>
          Download CV
        </DownloadCvButton>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center gap-3 pt-6">
            {applicant.headshotUrl ? (
              <Image
                src={applicant.headshotUrl}
                alt=""
                width={120}
                height={150}
                className="h-[150px] w-[120px] rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-[150px] w-[120px] items-center justify-center rounded-lg bg-muted text-muted-foreground">
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
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Personal information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2">
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

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Passport</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2">
              <Row label="Passport no." value={applicant.passportNo} />
              <Row label="Place of issue" value={applicant.passportIssuedAt} />
              <Row label="Date of issue" value={fmtDate(applicant.passportIssueDate)} />
              <Row label="Date of expiry" value={fmtDate(applicant.passportExpiryDate)} />
            </CardContent>
          </Card>

          {applicant.employmentHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Employment record</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                {applicant.employmentHistory.map((row) => (
                  <div key={row.id} className="text-sm">
                    {row.position} · {row.country} · {row.period}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
