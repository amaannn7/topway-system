import { prisma } from "@/lib/prisma";
import { InvoiceForm } from "../invoice-form";
import { getNextInvoiceNo } from "../actions";

export default async function NewInvoicePage() {
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
