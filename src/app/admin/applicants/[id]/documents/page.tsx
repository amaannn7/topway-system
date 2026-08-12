import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen } from "lucide-react";
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
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-info/10 text-info">
          <FolderOpen className="size-4.5" />
        </div>
        <div>
          <CardTitle className="text-sm">Photos &amp; identity documents</CardTitle>
          <CardDescription>
            Passport and alteration page are visible to the assigned agent only once this
            candidate is marked <strong>confirmed</strong> on the pipeline tab. Currently{" "}
            {applicant.confirmed ? "confirmed" : "not confirmed"}.
          </CardDescription>
        </div>
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
