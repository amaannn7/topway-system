import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAgentApplicant } from "@/lib/agent-applicant-view";
import { CvDocument } from "@/lib/cv-pdf";
import { uploadPathToPdfSrc, staticAssetToPdfSrc } from "@/lib/pdf-assets";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.portal !== "agent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const applicant = await getAgentApplicant(session.user.id, id);
  if (!applicant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const agent = await prisma.agent.findUnique({
    where: { id: session.user.id },
    select: { company: true, logoUrl: true },
  });
  const org = await prisma.orgSettings.findUnique({ where: { id: "singleton" } });

  const footerLines = [org?.defaultFooterLine1, org?.defaultFooterLine2, org?.defaultFooterLine3]
    .filter((line): line is string => !!line);

  // documents is already confirmed-gated by getAgentApplicant() (empty
  // array unless applicant.confirmed === true) — only image documents can
  // be embedded as extra PDF pages, see the note in lib/cv-pdf.tsx.
  const extraImagePages = applicant.documents
    .filter((d) => d.mimeType === "image/jpeg" || d.mimeType === "image/png")
    .map((d) => uploadPathToPdfSrc(d.url))
    .filter((p): p is Buffer => !!p);

  const pdfBuffer = await renderToBuffer(
    <CvDocument
      applicant={{
        ...applicant,
        headshotUrl: uploadPathToPdfSrc(applicant.headshotUrl),
        fullPhotoUrl: uploadPathToPdfSrc(applicant.fullPhotoUrl),
      }}
      agencyLogoUrl={uploadPathToPdfSrc(agent?.logoUrl ?? null)}
      agencyName={agent?.company ?? null}
      topwayLogoUrl={staticAssetToPdfSrc("brand/topway-logo.png")}
      footerLines={footerLines}
      extraImagePages={extraImagePages}
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
