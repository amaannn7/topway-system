import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Download } from "lucide-react";
import { PdfPreviewDialog, PdfPreviewTriggerButton } from "@/components/pdf-preview-dialog";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex gap-2 py-1 text-sm">
      <span className="min-w-40 shrink-0 font-medium text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" }).format(d);
}
function fmtAmount(n: number) {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { workers: { orderBy: { sortOrder: "asc" } } },
  });
  if (!invoice) notFound();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoice #{invoice.invoiceNo}</h1>
          <p className="text-sm text-muted-foreground">
            {invoice.billToTitle} {invoice.billToCompany}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href={`/admin/invoices/${invoice.id}/edit`} />}>
            <Pencil className="size-4" />
            Edit
          </Button>
          <PdfPreviewDialog
            pdfUrl={`/admin/invoices/${invoice.id}/pdf`}
            fileName={`Invoice_${invoice.invoiceNo}.pdf`}
            title={`Invoice #${invoice.invoiceNo}`}
            trigger={<PdfPreviewTriggerButton />}
          />
          <Button render={<a href={`/admin/invoices/${invoice.id}/pdf`} />}>
            <Download className="size-4" />
            Download PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Row label="Invoice date" value={fmtDate(invoice.invoicedDate)} />
            <Row label="Currency" value={invoice.currency} />
            <Row label="Purpose" value={invoice.billToPurpose} />
            <Row label="License number" value={invoice.billToLicenseNo} />
            <Row label="Service type" value={invoice.serviceType} />
            <Row label="Payment method" value={invoice.paymentMethod} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Bank details</CardTitle>
          </CardHeader>
          <CardContent>
            <Row label="Bank name" value={invoice.bankName} />
            <Row label="Account number" value={invoice.accountNo} />
            <Row label="Account name" value={invoice.accountName} />
            <Row label="SWIFT code" value={invoice.swiftCode} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Workers</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {invoice.workers.map((w) => (
            <div key={w.id} className="flex justify-between text-sm">
              <span>
                {w.name} × {w.qty}
              </span>
              <span className="tabular-nums">
                {invoice.currency} {fmtAmount(Number(w.amount))}
              </span>
            </div>
          ))}
          {invoice.advanceStatus !== "NONE" && (
            <div className="flex justify-between border-t pt-1 text-sm text-muted-foreground">
              <span>Advance ({invoice.advanceStatus.toLowerCase()})</span>
              <span className="tabular-nums">
                {invoice.currency} {fmtAmount(Number(invoice.advanceAmount))}
              </span>
            </div>
          )}
          <div className="flex justify-between border-t pt-2 text-sm font-semibold">
            <span>Total</span>
            <span className="tabular-nums">
              {invoice.currency} {fmtAmount(Number(invoice.total))}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
