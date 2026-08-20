import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Download, FileText, Landmark, Users2, Lock } from "lucide-react";
import { PdfPreviewDialog } from "@/components/pdf-preview-dialog";
import { auth } from "@/lib/auth";
import { canViewPayments } from "@/lib/require-session";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-baseline sm:gap-2">
      <span className="text-xs font-medium text-muted-foreground sm:min-w-40 sm:shrink-0 sm:text-sm">
        {label}
      </span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function SectionIcon({
  icon: Icon,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${className}`}>
      <Icon className="size-4.5" />
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
  const session = await auth();
  // Same as the invoices list — the whole invoice (not just the bank/amount
  // fields) is off-limits to staff without payment access.
  if (!session?.user || !canViewPayments(session.user)) {
    return (
      <Card className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground shadow-sm">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Lock className="size-6" />
        </div>
        <p>You don&apos;t have access to invoices.</p>
      </Card>
    );
  }

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { workers: { orderBy: { sortOrder: "asc" } } },
  });
  if (!invoice) notFound();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 ring-1 ring-primary/10">
        <div className="flex items-center gap-3.5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/10">
            <FileText className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Invoice #{invoice.invoiceNo}</h1>
            <p className="text-sm text-muted-foreground">
              {invoice.billToTitle} {invoice.billToCompany}
            </p>
          </div>
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
            triggerSize="default"
          />
          <Button render={<a href={`/admin/invoices/${invoice.id}/pdf`} />}>
            <Download className="size-4" />
            Download PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <SectionIcon icon={FileText} className="bg-primary/10 text-primary" />
            <CardTitle className="text-sm">Details</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border/60">
            <Row label="Invoice date" value={fmtDate(invoice.invoicedDate)} />
            <Row label="Currency" value={invoice.currency} />
            <Row label="Purpose" value={invoice.billToPurpose} />
            <Row label="License number" value={invoice.billToLicenseNo} />
            <Row label="Service type" value={invoice.serviceType} />
            <Row label="Payment method" value={invoice.paymentMethod} />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <SectionIcon icon={Landmark} className="bg-info/10 text-info" />
            <CardTitle className="text-sm">Bank details</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border/60">
            <Row label="Bank name" value={invoice.bankName} />
            <Row label="Account number" value={invoice.accountNo} />
            <Row label="Account name" value={invoice.accountName} />
            <Row label="SWIFT code" value={invoice.swiftCode} />
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
          <SectionIcon icon={Users2} className="bg-primary/10 text-primary" />
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
