import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canViewPayments } from "@/lib/require-session";
import { Card } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { InvoiceForm } from "../../invoice-form";
import type { InvoiceFormValues } from "@/lib/validations/invoice";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || !canViewPayments(session.user)) {
    return (
      <Card className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground shadow-sm">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Lock className="size-6" />
        </div>
        <p>You don&apos;t have access to payment information.</p>
      </Card>
    );
  }

  const { id } = await params;
  const [invoice, agents] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id },
      include: { workers: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.agent.findMany({
      where: { active: true },
      orderBy: { company: "asc" },
      select: { id: true, name: true, company: true, country: true },
    }),
  ]);
  if (!invoice) notFound();

  const defaultValues: Partial<InvoiceFormValues> = {
    invoiceNo: invoice.invoiceNo,
    invoicedDate: invoice.invoicedDate.toISOString().slice(0, 10),
    currency: invoice.currency,
    agentId: invoice.agentId,
    billToTitle: invoice.billToTitle as InvoiceFormValues["billToTitle"],
    billToCompany: invoice.billToCompany,
    billToPurpose: invoice.billToPurpose,
    billToLicenseNo: invoice.billToLicenseNo ?? "",
    serviceType: invoice.serviceType,
    workers: invoice.workers.map((w) => ({
      applicantId: w.applicantId,
      name: w.name,
      qty: w.qty,
      amount: Number(w.amount),
    })),
    advanceStatus: invoice.advanceStatus,
    advanceAmount: Number(invoice.advanceAmount),
    total: Number(invoice.total),
    paymentMethod: invoice.paymentMethod as InvoiceFormValues["paymentMethod"],
    bankName: invoice.bankName,
    accountNo: invoice.accountNo,
    accountName: invoice.accountName,
    swiftCode: invoice.swiftCode,
    notes: invoice.notes ?? "",
    footerEmail: invoice.footerEmail,
    footerPhone: invoice.footerPhone,
    footerFax: invoice.footerFax,
    footerAddress: invoice.footerAddress,
    footerWebsite: invoice.footerWebsite,
  };

  return <InvoiceForm invoiceId={invoice.id} defaultValues={defaultValues} agents={agents} />;
}
