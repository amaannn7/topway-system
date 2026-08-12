import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Receipt, FileText } from "lucide-react";
import { DeleteInvoiceButton } from "./delete-invoice-button";
import { PdfPreviewDialog } from "@/components/pdf-preview-dialog";
import { auth } from "@/lib/auth";
import { canViewPayments } from "@/lib/require-session";
import { MaskedAmount } from "./masked-amount";

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" }).format(d);
}
function fmtAmount(n: number) {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
}

export default async function AdminInvoicesPage() {
  const [invoices, session] = await Promise.all([
    prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { workers: true } } },
    }),
    auth(),
  ]);
  const canSeePayments = !!session?.user && canViewPayments(session.user);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground">
            {invoices.length} invoice{invoices.length === 1 ? "" : "s"}
          </p>
        </div>
        {canSeePayments && (
          <Button size="lg" className="rounded-full px-4" render={<Link href="/admin/invoices/new" />}>
            <Plus className="size-4" />
            New invoice
          </Button>
        )}
      </div>

      {invoices.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground shadow-sm">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Receipt className="size-6" />
          </div>
          <p>No invoices yet. Create your first one.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {invoices.map((inv) => (
            <Card
              key={inv.id}
              className="flex flex-row items-center gap-5 overflow-hidden border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/15 shadow-sm ring-1 ring-primary/10">
                <p className="text-sm font-bold text-primary tabular-nums">#{inv.invoiceNo}</p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">
                  {inv.billToTitle} {inv.billToCompany}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {fmtDate(inv.invoicedDate)} · {inv._count.workers} worker
                  {inv._count.workers === 1 ? "" : "s"} · {inv.paymentMethod}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold tabular-nums">
                  {canSeePayments ? (
                    `${inv.currency} ${fmtAmount(Number(inv.total))}`
                  ) : (
                    <MaskedAmount />
                  )}
                </p>
                <p className="text-[10px] font-medium text-muted-foreground uppercase">Total</p>
              </div>
              <div className="flex shrink-0 items-center gap-1 border-l pl-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  render={<Link href={`/admin/invoices/${inv.id}`} aria-label="View invoice details" />}
                >
                  <FileText className="size-4" />
                </Button>
                <PdfPreviewDialog
                  pdfUrl={`/admin/invoices/${inv.id}/pdf`}
                  fileName={`Invoice_${inv.invoiceNo}.pdf`}
                  title={`Invoice #${inv.invoiceNo}`}
                  triggerVariant="ghost"
                  triggerSize="icon"
                  triggerClassName="rounded-full"
                  triggerIconOnly
                  triggerAriaLabel="Preview PDF"
                />
                <DeleteInvoiceButton invoiceId={inv.id} invoiceNo={inv.invoiceNo} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
