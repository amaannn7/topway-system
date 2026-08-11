import { z } from "zod";

export const customerFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  companyName: z.string().trim().max(160),
  username: z
    .string()
    .trim()
    .min(3, "At least 3 characters")
    .max(60)
    .transform((v) => v.toLowerCase()),
  password: z.union([z.string().min(8, "At least 8 characters"), z.literal("")]),
  active: z.boolean(),
});

export type CustomerFormValues = z.output<typeof customerFormSchema>;
