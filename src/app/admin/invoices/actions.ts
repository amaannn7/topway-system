"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requirePaymentAccess } from "@/lib/require-session";
import { logAudit } from "@/lib/audit";
import { invoiceFormSchema } from "@/lib/validations/invoice";

function buildInvoiceData(values: ReturnType<typeof invoiceFormSchema.parse>) {
  return {
    invoiceNo: values.invoiceNo,
    invoicedDate: new Date(`${values.invoicedDate}T00:00:00.000Z`),
    currency: values.currency,
    agentId: values.agentId || null,
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
  };
}

export async function createInvoice(raw: unknown) {
  const admin = await requirePaymentAccess();
  const values = invoiceFormSchema.parse(raw);

  const existing = await prisma.invoice.findUnique({ where: { invoiceNo: values.invoiceNo } });
  if (existing) throw new Error("An invoice with that number already exists");

  const invoice = await prisma.invoice.create({
    data: {
      ...buildInvoiceData(values),
      workers: {
        create: values.workers.map((w, i) => ({
          applicantId: w.applicantId || null,
          name: w.name,
          qty: w.qty,
          amount: w.amount,
          sortOrder: i,
        })),
      },
    },
  });

  await logAudit({
    adminUserId: admin.id,
    action: "CREATE",
    entityType: "Invoice",
    entityId: invoice.id,
    summary: `Created invoice #${invoice.invoiceNo} for ${invoice.billToCompany}`,
  });

  revalidatePath("/admin/invoices");
  redirect(`/admin/invoices/${invoice.id}`);
}

export async function updateInvoice(invoiceId: string, raw: unknown) {
  const admin = await requirePaymentAccess();
  const values = invoiceFormSchema.parse(raw);

  const existing = await prisma.invoice.findUnique({ where: { invoiceNo: values.invoiceNo } });
  if (existing && existing.id !== invoiceId) {
    throw new Error("An invoice with that number already exists");
  }

  await prisma.$transaction([
    prisma.invoice.update({ where: { id: invoiceId }, data: buildInvoiceData(values) }),
    prisma.invoiceWorker.deleteMany({ where: { invoiceId } }),
    prisma.invoiceWorker.createMany({
      data: values.workers.map((w, i) => ({
        invoiceId,
        applicantId: w.applicantId || null,
        name: w.name,
        qty: w.qty,
        amount: w.amount,
        sortOrder: i,
      })),
    }),
  ]);

  await logAudit({
    adminUserId: admin.id,
    action: "UPDATE",
    entityType: "Invoice",
    entityId: invoiceId,
    summary: `Updated invoice #${values.invoiceNo}`,
  });

  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/invoices/${invoiceId}`);
}

export async function deleteInvoice(invoiceId: string) {
  const admin = await requireAdmin();
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { invoiceNo: true, billToCompany: true },
  });
  if (!invoice) throw new Error("Invoice not found");

  await prisma.invoice.delete({ where: { id: invoiceId } });

  await logAudit({
    adminUserId: admin.id,
    action: "DELETE",
    entityType: "Invoice",
    entityId: invoiceId,
    summary: `Deleted invoice #${invoice.invoiceNo} for ${invoice.billToCompany}`,
  });

  revalidatePath("/admin/invoices");
}

export async function getNextInvoiceNo() {
  await requireAdmin();
  const last = await prisma.invoice.findFirst({
    orderBy: { createdAt: "desc" },
    select: { invoiceNo: true },
  });
  const max = last ? parseInt(last.invoiceNo, 10) || 0 : 0;
  return String(max + 1).padStart(2, "0");
}
