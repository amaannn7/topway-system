// Option lists carried over from the legacy portal's <datalist>/<select>
// values (index.html) — same business vocabulary, just centralized instead
// of duplicated across three HTML files.

export const ROLE_OPTIONS = [
  "HOUSEMAID",
  "COOK",
  "NANNY",
  "CAREGIVER",
  "DRIVER",
] as const;

export const CONTRACT_OPTIONS = ["1 YEAR", "2 YEARS", "3 YEARS"] as const;

export const NATIONALITY_OPTIONS = [
  "Sri Lankan",
  "Filipino",
  "Indonesian",
  "Indian",
  "Kenyan",
  "Ugandan",
  "Ghanaian",
  "Ethiopian",
  "Bangladeshi",
  "Nepali",
  "Pakistani",
  "Other",
] as const;

export const RELIGION_OPTIONS = [
  "Islam",
  "Christianity",
  "Hinduism",
  "Buddhism",
  "Other",
] as const;

export const EDUCATION_OPTIONS = [
  "Primary School",
  "Grade 8",
  "Grade 10",
  "O/L",
  "A/L",
  "Diploma",
  "University",
] as const;

export const PASSPORT_ISSUE_PLACE_OPTIONS = [
  "Colombo",
  "Kandy",
  "Galle",
  "Jaffna",
  "Kurunegala",
  "Other",
] as const;

export const EMPLOYMENT_POSITION_OPTIONS = [
  "Housemaid",
  "Cook",
  "Nanny",
  "Caregiver",
  "Cleaner",
] as const;

export const EMPLOYMENT_COUNTRY_OPTIONS = [
  "Saudi Arabia",
  "UAE",
  "Kuwait",
  "Qatar",
  "Oman",
  "Bahrain",
] as const;

export const EXPERIENCE_TYPE_LABELS = {
  HM_21_49_EXP: "HM 21-49 Exp",
  HM_50_55_EXP: "HM 50-55 Exp",
  HM_51_55_EXP: "HM 51-55 Exp",
  HM_FIRST_TIME: "HM - First Time",
  COUPLE: "Couple",
  DRIVER: "Driver",
  HOUSE_BOY: "House Boy",
} as const;

export const WORKER_CATEGORY_LABELS = {
  AVAILABLE_EXPERIENCED: "Available — Experienced",
  AVAILABLE_INEXPERIENCED: "Available — Inexperienced",
  CONTRACTED: "Contracted",
} as const;

export const MARITAL_STATUS_LABELS = {
  SINGLE: "Single",
  MARRIED: "Married",
  DIVORCED: "Divorced",
  WIDOWED: "Widowed",
} as const;

// Fixed pipeline order — Medical -> Enjaz -> Bureau -> Wakalah -> Embassy ->
// Payment. This exact sequence is the one legacy business rule that must
// never change (Phase 1 §3 / §7 rule 1).
export const PIPELINE_STEPS = [
  { key: "MEDICAL", label: "Medical" },
  { key: "ENJAZ", label: "Enjaz" },
  { key: "BUREAU", label: "Bureau" },
  { key: "WAKALAH", label: "Wakalah" },
  { key: "EMBASSY", label: "Embassy" },
  { key: "PAYMENT", label: "Payment" },
] as const;
