import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-session";
import { CvDocument } from "@/lib/cv-pdf";
import { deriveStatus } from "@/lib/pipeline-status";
import { uploadPathToPdfSrc, staticAssetToPdfSrc } from "@/lib/pdf-assets";

// Admin-side CV preview/download — legacy index.html let admin build,
// preview, and export any profile's PDF directly from the builder screen.
// The rebuilt admin applicant pages had a builder/pipeline/documents flow
// but no PDF export entry point at all; this closes that gap using the
// same CvDocument template the agent portal uses, with the org's shared
// logo (admin isn't viewing this on behalf of any specific agent).

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [applicant, org] = await Promise.all([
    prisma.applicant.findUnique({
      where: { id },
      include: {
        employmentHistory: { orderBy: { sortOrder: "asc" } },
        photos: true,
        pipelineSteps: { select: { key: true, completed: true } },
      },
    }),
    prisma.orgSettings.findUnique({ where: { id: "singleton" } }),
  ]);
  if (!applicant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const footerLines = [org?.defaultFooterLine1, org?.defaultFooterLine2, org?.defaultFooterLine3]
    .filter((line): line is string => !!line);

  const pdfBuffer = await renderToBuffer(
    <CvDocument
      applicant={{
        ...applicant,
        status: deriveStatus(applicant),
        headshotUrl: uploadPathToPdfSrc(applicant.photos.find((p) => p.kind === "HEADSHOT")?.url ?? null),
        fullPhotoUrl: uploadPathToPdfSrc(applicant.photos.find((p) => p.kind === "FULL_BODY")?.url ?? null),
        documents: [], // admin has its own Documents tab; the CV export doesn't attach them here
      }}
      agencyLogoUrl={uploadPathToPdfSrc(org?.headerLogoUrl ?? null)}
      agencyName={null}
      topwayLogoUrl={staticAssetToPdfSrc("brand/topway-logo.png")}
      footerLines={footerLines}
    />
  );

  const safeName = (applicant.name || "candidate").replace(/[^a-z0-9]+/gi, "-").toLowerCase();

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}-cv.pdf"`,
    },
  });
}
