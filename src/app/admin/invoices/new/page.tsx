import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canViewPayments } from "@/lib/require-session";
import { Card } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { InvoiceForm } from "../invoice-form";
import { getNextInvoiceNo } from "../actions";

export default async function NewInvoicePage() {
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

  const [invoiceNo, agents, settings] = await Promise.all([
    getNextInvoiceNo(),
    prisma.agent.findMany({
      where: { active: true },
      orderBy: { company: "asc" },
      select: { id: true, name: true, company: true, country: true },
    }),
    prisma.orgSettings.findUnique({ where: { id: "singleton" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New invoice</h1>
      </div>
      <InvoiceForm
        agents={agents}
        defaultValues={{
          invoiceNo,
          bankName: settings?.defaultBankName,
          accountNo: settings?.defaultAccountNo,
          accountName: settings?.defaultAccountName,
          swiftCode: settings?.defaultSwiftCode,
          footerEmail: settings?.invoiceFooterEmail,
          footerPhone: settings?.invoiceFooterPhone,
          footerFax: settings?.invoiceFooterFax,
          footerAddress: settings?.invoiceFooterAddress,
          footerWebsite: settings?.invoiceFooterWebsite,
        }}
      />
    </div>
  );
}
