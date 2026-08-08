import { z } from "zod";

// Matches the Prisma Agent model. Password is required on create, optional
// on update (blank = keep existing) — same semantics as the legacy
// admin_agents.php save_agent action (Phase 1 §2.2), just with real bcrypt
// hashing happening server-side in the action, not here.
export const agentFormSchema = z.object({
  name: z.string().trim().min(1, "Contact name is required").max(120),
  company: z.string().trim().min(1, "Company name is required").max(160),
  country: z.string().trim().min(1, "Country is required").max(80),
  username: z
    .string()
    .trim()
    .min(3, "At least 3 characters")
    .max(40)
    .regex(/^[a-z0-9._-]+$/i, "Letters, numbers, dots, underscores, and hyphens only")
    .transform((v) => v.toLowerCase()),
  password: z.union([z.string().min(8, "At least 8 characters"), z.literal("")]),
  active: z.boolean(),
});

export type AgentFormValues = z.output<typeof agentFormSchema>;
