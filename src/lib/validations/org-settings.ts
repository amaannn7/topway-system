import { z } from "zod";

export const orgDefaultsSchema = z.object({
  defaultFooterLine1: z.string().trim().max(160),
  defaultFooterLine2: z.string().trim().max(160),
  defaultFooterLine3: z.string().trim().max(160),
  invoiceFooterEmail: z.string().trim().max(120),
  invoiceFooterPhone: z.string().trim().max(60),
  invoiceFooterFax: z.string().trim().max(60),
  invoiceFooterAddress: z.string().trim().max(240),
  invoiceFooterWebsite: z.string().trim().max(120),
  defaultBankName: z.string().trim().max(120),
  defaultAccountNo: z.string().trim().max(60),
  defaultAccountName: z.string().trim().max(120),
  defaultSwiftCode: z.string().trim().max(30),
});

export type OrgDefaultsValues = z.output<typeof orgDefaultsSchema>;
