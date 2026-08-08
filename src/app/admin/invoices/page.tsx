import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Receipt, FileText, Download } from "lucide-react";
import { DeleteInvoiceButton } from "./delete-invoice-button";
import { PdfPreviewDialog } from "@/components/pdf-preview-dialog";

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" }).format(d);
}
function fmtAmount(n: number) {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
}

export default async function AdminInvoicesPage() {
  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { workers: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground">
            {invoices.length} invoice{invoices.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button render={<Link href="/admin/invoices/new" />}>
          <Plus className="size-4" />
          New invoice
        </Button>
      </div>

      {invoices.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
          <Receipt className="size-8 opacity-40" />
          <p>No invoices yet. Create your first one.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {invoices.map((inv) => (
            <Card key={inv.id} className="flex flex-row items-center gap-4 p-4">
              <div className="text-center">
                <p className="text-lg font-bold text-primary tabular-nums">#{inv.invoiceNo}</p>
                <p className="text-[10px] font-medium text-muted-foreground uppercase">Invoice</p>
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
                  {inv.currency} {fmtAmount(Number(inv.total))}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase">Total</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  render={<Link href={`/admin/invoices/${inv.id}`} aria-label="View invoice details" />}
                >
                  <FileText className="size-4" />
                </Button>
                <PdfPreviewDialog
                  pdfUrl={`/admin/invoices/${inv.id}/pdf`}
                  fileName={`Invoice_${inv.invoiceNo}.pdf`}
                  title={`Invoice #${inv.invoiceNo}`}
                  trigger={
                    <Button variant="ghost" size="icon" aria-label="Preview PDF">
                      <Download className="size-4" />
                    </Button>
                  }
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
