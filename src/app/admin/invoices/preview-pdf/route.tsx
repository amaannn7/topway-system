import { NextResponse } from "next/server";
import path from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-session";
import { invoiceFormSchema } from "@/lib/validations/invoice";
import { InvoiceDocument } from "@/lib/invoice-pdf";

function toLocalPath(url: string | null | undefined): string | null {
  if (!url || !url.startsWith("/uploads/")) return null;
  return path.join(process.cwd(), "public", url);
}

// Renders a PDF from unsaved form values — matches the legacy invoice.html
// previewFromForm() behavior (preview before the first save). Nothing is
// persisted; this is a pure render.
export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = invoiceFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid invoice data" }, { status: 400 });
  }
  const values = parsed.data;

  const settings = await prisma.orgSettings.findUnique({ where: { id: "singleton" } });

  const previewInvoice = {
    id: "preview",
    invoiceNo: values.invoiceNo || "—",
    invoicedDate: new Date(`${values.invoicedDate}T00:00:00.000Z`),
    currency: values.currency,
    agentId: values.agentId ?? null,
    billToTitle: values.billToTitle,
    billToCompany: values.billToCompany,
    billToPurpose: values.billToPurpose,
    billToLicenseNo: values.billToLicenseNo || null,
    serviceType: values.serviceType,
    advanceStatus: values.advanceStatus,
    advanceAmount: values.advanceStatus === "NONE" ? 0 : values.advanceAmount,
    total: values.total,
    paymentMethod: values.paymentMethod,
    bankName: values.bankName,
    accountNo: values.accountNo,
    accountName: values.accountName,
    swiftCode: values.swiftCode,
    notes: values.notes || null,
    footerEmail: values.footerEmail,
    footerPhone: values.footerPhone,
    footerFax: values.footerFax,
    footerAddress: values.footerAddress,
    footerWebsite: values.footerWebsite,
    createdAt: new Date(),
    updatedAt: new Date(),
    workers: values.workers.map((w, i) => ({
      id: `preview-${i}`,
      invoiceId: "preview",
      applicantId: w.applicantId ?? null,
      name: w.name,
      qty: w.qty,
      amount: w.amount,
      sortOrder: i,
    })),
  };

  const pdfBuffer = await renderToBuffer(
    <InvoiceDocument
      // @ts-expect-error — plain numbers stand in for Prisma.Decimal here;
      // InvoiceDocument only ever calls Number(...) on these fields.
      invoice={previewInvoice}
      logoUrl={toLocalPath(settings?.headerLogoUrl)}
    />
  );

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: { "Content-Type": "application/pdf" },
  });
}
