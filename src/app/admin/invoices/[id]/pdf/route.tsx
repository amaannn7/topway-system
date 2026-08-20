import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { requirePaymentAccess } from "@/lib/require-session";
import { InvoiceDocument } from "@/lib/invoice-pdf";
import { uploadPathToPdfSrc } from "@/lib/pdf-assets";

// requirePaymentAccess, not just requireAdmin — this PDF embeds bank
// account number, SWIFT code, and the total, so anyone who can hit this
// route directly gets the same data the UI masks for staff without
// canViewPayments. The UI-level mask on the invoice detail page is not a
// substitute for gating this route.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePaymentAccess();
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

  const logoUrl = await uploadPathToPdfSrc(settings?.headerLogoUrl);

  const pdfBuffer = await renderToBuffer(
    <InvoiceDocument invoice={invoice} logoUrl={logoUrl} />
  );

  const safeCompany = invoice.billToCompany.replace(/[^a-z0-9]+/gi, "_");

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Invoice_${invoice.invoiceNo}_${safeCompany}.pdf"`,
    },
  });
}
