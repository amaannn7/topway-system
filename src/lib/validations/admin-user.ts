import { z } from "zod";

export const adminUserFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .transform((v) => v.toLowerCase()),
  password: z.union([z.string().min(8, "At least 8 characters"), z.literal("")]),
  role: z.enum(["OWNER", "STAFF"]),
  active: z.boolean(),
  canViewPayments: z.boolean(),
});

export type AdminUserFormValues = z.output<typeof adminUserFormSchema>;
