import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCustomerApplicant } from "@/lib/agent-applicant-view";
import { CvDocument } from "@/lib/cv-pdf";
import { uploadPathToPdfSrc, staticAssetToPdfSrc } from "@/lib/pdf-assets";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.portal !== "customer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const applicant = await getCustomerApplicant(session.user.id, id);
  if (!applicant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Branding follows the sponsoring agent, not the customer (customers
  // have no logo of their own — see Customer model, agent-managed).
  const agent = session.user.agentId
    ? await prisma.agent.findUnique({
        where: { id: session.user.agentId },
        select: { company: true, logoUrl: true },
      })
    : null;
  const org = await prisma.orgSettings.findUnique({ where: { id: "singleton" } });

  const footerLines = [org?.defaultFooterLine1, org?.defaultFooterLine2, org?.defaultFooterLine3]
    .filter((line): line is string => !!line);

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
