import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-session";
import { InvoiceDocument } from "@/lib/invoice-pdf";
import { uploadPathToPdfSrc } from "@/lib/pdf-assets";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [invoice, settings] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id },
      include: { workers: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.orgSettings.findUnique({ where: { id: "singleton" } }),
  ]);
  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pdfBuffer = await renderToBuffer(
    <InvoiceDocument invoice={invoice} logoUrl={uploadPathToPdfSrc(settings?.headerLogoUrl)} />
  );

  const safeCompany = invoice.billToCompany.replace(/[^a-z0-9]+/gi, "_");

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Invoice_${invoice.invoiceNo}_${safeCompany}.pdf"`,
    },
  });
}
