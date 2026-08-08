import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default async function ApplicantDocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const applicant = await prisma.applicant.findUnique({
    where: { id },
    select: {
      confirmed: true,
      photos: true,
      documents: true,
    },
  });
  if (!applicant) notFound();

  const passport = applicant.documents.find((d) => d.kind === "PASSPORT");
  const alteration = applicant.documents.find((d) => d.kind === "ALTERATION_PAGE");

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Identity documents</CardTitle>
          <CardDescription>
            Visible to the assigned agent only once this candidate is marked{" "}
            <strong>confirmed</strong> on the pipeline tab — currently{" "}
            {applicant.confirmed ? "confirmed" : "not confirmed"}.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { label: "Passport photo / scan", doc: passport },
            { label: "Alteration & observation page", doc: alteration },
          ].map(({ label, doc }) => (
            <div
              key={label}
              className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center text-sm text-muted-foreground"
            >
              <FileText className="size-6" />
              <span>{label}</span>
              <span className="text-xs">
                {doc ? "Uploaded" : "Upload not yet wired up — coming next"}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Photos</CardTitle>
          <CardDescription>
            Headshot is always derived from the full-body photo via a crop — never uploaded
            standalone.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {["FULL_BODY", "HEADSHOT"].map((kind) => {
            const photo = applicant.photos.find((p) => p.kind === kind);
            return (
              <div
                key={kind}
                className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center text-sm text-muted-foreground"
              >
                <FileText className="size-6" />
                <span>{kind === "FULL_BODY" ? "Full body photo" : "Headshot"}</span>
                <span className="text-xs">
                  {photo ? "Uploaded" : "Upload not yet wired up — coming next"}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
