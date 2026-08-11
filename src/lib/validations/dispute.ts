import { z } from "zod";

export const disputeSchema = z.object({
  category: z.enum(["RUNAWAY", "REFUSAL_TO_WORK", "MEDICALLY_UNFIT", "OTHER"]),
  notes: z.string().trim().max(1000),
});

export type DisputeFormValues = z.output<typeof disputeSchema>;
