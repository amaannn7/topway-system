import { z } from "zod";

// Matches the Invoice/InvoiceWorker Prisma models. `total` and worker
// `amount`/`qty` are real numbers here — the legacy invoice.html stored
// the displayed total as a free-text string the user could type over the
// live-calculated subtotal, with no guarantee it matched the line items
// (Phase 1 §6). This keeps the same "user can see the calculated total and
// still adjust it" UX, but the stored value is always a real Decimal.
export const invoiceWorkerSchema = z.object({
  applicantId: z.string().nullable().optional(),
  name: z.string().trim().min(1, "Worker name is required"),
  qty: z.coerce.number().int().min(1),
  amount: z.coerce.number().min(0),
});

export const invoiceFormSchema = z.object({
  invoiceNo: z.string().trim().min(1, "Invoice number is required"),
  invoicedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  currency: z.enum(["KD", "USD", "SAR", "AED", "QAR", "BHD", "OMR", "EUR"]),

  agentId: z.string().nullable().optional(),
  billToTitle: z.enum(["MR.", "MRS.", "MS.", "DR.", "COMPANY"]),
  billToCompany: z.string().trim().min(1, "Company / name is required").max(160),
  billToPurpose: z.string().trim().min(1).max(200),
  billToLicenseNo: z.string().trim().max(40),

  serviceType: z.string().trim().min(1).max(120),
  workers: z.array(invoiceWorkerSchema).min(1, "Add at least one worker"),

  advanceStatus: z.enum(["NONE", "REQUESTED", "PAID"]),
  advanceAmount: z.coerce.number().min(0),
  total: z.coerce.number().min(0),

  paymentMethod: z.enum(["REMITTANCE", "BANK TRANSFER", "CASH", "CHEQUE", "WIRE TRANSFER"]),

  bankName: z.string().trim().min(1).max(120),
  accountNo: z.string().trim().min(1).max(60),
  accountName: z.string().trim().min(1).max(120),
  swiftCode: z.string().trim().min(1).max(30),

  notes: z.string().trim().max(2000),

  footerEmail: z.string().trim().max(120),
  footerPhone: z.string().trim().max(60),
  footerFax: z.string().trim().max(60),
  footerAddress: z.string().trim().max(240),
  footerWebsite: z.string().trim().max(120),
});

export type InvoiceFormValues = z.output<typeof invoiceFormSchema>;
