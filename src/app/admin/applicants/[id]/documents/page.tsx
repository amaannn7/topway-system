import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentsPanel } from "./documents-panel";

export default async function ApplicantDocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const applicant = await prisma.applicant.findUnique({
    where: { id },
    select: { id: true, confirmed: true, photos: true, documents: true },
  });
  if (!applicant) notFound();

  const fullPhoto = applicant.photos.find((p) => p.kind === "FULL_BODY");
  const headshot = applicant.photos.find((p) => p.kind === "HEADSHOT");
  const passport = applicant.documents.find((d) => d.kind === "PASSPORT");
  const alteration = applicant.documents.find((d) => d.kind === "ALTERATION_PAGE");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Photos &amp; identity documents</CardTitle>
        <CardDescription>
          Passport and alteration page are visible to the assigned agent only once this
          candidate is marked <strong>confirmed</strong> on the pipeline tab — currently{" "}
          {applicant.confirmed ? "confirmed" : "not confirmed"}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DocumentsPanel
          applicantId={applicant.id}
          fullPhotoUrl={fullPhoto?.url ?? null}
          headshotUrl={headshot?.url ?? null}
          passport={passport ?? null}
          alteration={alteration ?? null}
        />
      </CardContent>
    </Card>
  );
}
