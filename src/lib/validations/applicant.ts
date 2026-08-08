import { z } from "zod";

// Matches the Prisma Applicant model's editable fields. Dates come in as
// "YYYY-MM-DD" strings from <input type="date">; numeric fields come in as
// strings from form inputs and are coerced. Every field always has a value
// from the form (empty string for "not set") — no z.optional()/.default()
// asymmetry, so the inferred input and output types are identical, which
// keeps zodResolver's generics happy.
const dateOrEmpty = z.union([
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  z.literal(""),
]);

const intOrEmpty = z.union([z.coerce.number().int(), z.literal("")]);

export const employmentRecordSchema = z.object({
  position: z.string().trim().min(1, "Position is required"),
  country: z.string().trim().min(1, "Country is required"),
  period: z.string().trim().min(1, "Period is required"),
});

export const applicantFormSchema = z.object({
  // F — Reference
  refNo: z.string().trim().max(20),
  name: z.string().trim().min(1, "Candidate name is required").max(120),

  // A — Role
  role: z.string().trim().min(1),
  contract: z.string().trim().min(1),

  // C — Personal
  nationality: z.string().trim(),
  religion: z.string().trim(),
  dateOfBirth: dateOrEmpty,
  age: intOrEmpty,
  heightCm: intOrEmpty,
  weightKg: intOrEmpty,
  maritalStatus: z.union([
    z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"]),
    z.literal(""),
  ]),
  children: intOrEmpty,

  // D — Passport
  passportNo: z.string().trim().max(30),
  passportIssuedAt: z.string().trim().max(60),
  passportIssueDate: dateOrEmpty,
  passportExpiryDate: dateOrEmpty,

  // E — Education
  educationLevel: z.string().trim(),
  educationYear: intOrEmpty,

  // B — Skills
  skillCleaning: z.coerce.boolean(),
  skillWashing: z.coerce.boolean(),
  skillBabysitting: z.coerce.boolean(),
  skillCooking: z.coerce.boolean(),
  skillDriving: z.coerce.boolean(),

  // H — Languages
  englishSpeaking: z.coerce.boolean(),
  englishWriting: z.coerce.boolean(),
  arabicSpeaking: z.coerce.boolean(),
  arabicWriting: z.coerce.boolean(),

  // I — PDF footer overrides
  footerLine1: z.string().trim().max(160),
  footerLine2: z.string().trim().max(160),
  footerLine3: z.string().trim().max(160),

  // H2 — Internal-only contact (never sent to agents — Phase 1 §7 rule 4)
  phone: z.string().trim().max(40),
  whatsapp: z.string().trim().max(40),
  email: z.union([z.string().trim().email(), z.literal("")]),
  emergencyContact: z.string().trim().max(40),
  address: z.string().trim().max(240),

  employmentHistory: z.array(employmentRecordSchema),
});

export type ApplicantFormValues = z.output<typeof applicantFormSchema>;

export const pipelineUpdateSchema = z.object({
  applicantId: z.string().min(1),
  steps: z.array(
    z.object({
      key: z.enum(["MEDICAL", "ENJAZ", "BUREAU", "WAKALAH", "EMBASSY", "PAYMENT"]),
      completed: z.boolean(),
    })
  ),
  workerCategory: z
    .enum(["AVAILABLE_EXPERIENCED", "AVAILABLE_INEXPERIENCED", "CONTRACTED"])
    .nullable()
    .optional(),
  experienceType: z
    .enum([
      "HM_21_49_EXP",
      "HM_50_55_EXP",
      "HM_51_55_EXP",
      "HM_FIRST_TIME",
      "COUPLE",
      "DRIVER",
      "HOUSE_BOY",
    ])
    .nullable()
    .optional(),
  confirmed: z.boolean().optional(),
  pipelineStatus: z.enum(["ACTIVE", "SENT", "CANCELLED"]).optional(),
  musanedDate: dateOrEmpty,
  ticketDate: dateOrEmpty,
  saudiAgentVisaDate: dateOrEmpty,
  notes: z.string().trim().max(2000),
});

export type PipelineUpdateValues = z.output<typeof pipelineUpdateSchema>;
