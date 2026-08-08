"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import {
  applicantFormSchema,
  type ApplicantFormValues,
} from "@/lib/validations/applicant";
import {
  ROLE_OPTIONS,
  CONTRACT_OPTIONS,
  NATIONALITY_OPTIONS,
  RELIGION_OPTIONS,
  EDUCATION_OPTIONS,
  EMPLOYMENT_POSITION_OPTIONS,
  EMPLOYMENT_COUNTRY_OPTIONS,
  MARITAL_STATUS_LABELS,
} from "@/lib/constants/applicant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createApplicant, updateApplicant } from "./actions";

const DEFAULT_VALUES: ApplicantFormValues = {
  refNo: "",
  name: "",
  role: "HOUSEMAID",
  contract: "2 YEARS",
  nationality: "",
  religion: "",
  dateOfBirth: "",
  age: "",
  heightCm: "",
  weightKg: "",
  maritalStatus: "",
  children: "",
  passportNo: "",
  passportIssuedAt: "",
  passportIssueDate: "",
  passportExpiryDate: "",
  educationLevel: "",
  educationYear: "",
  skillCleaning: false,
  skillWashing: false,
  skillBabysitting: false,
  skillCooking: false,
  skillDriving: false,
  englishSpeaking: false,
  englishWriting: false,
  arabicSpeaking: false,
  arabicWriting: false,
  footerLine1: "",
  footerLine2: "",
  footerLine3: "",
  phone: "",
  whatsapp: "",
  email: "",
  emergencyContact: "",
  address: "",
  employmentHistory: [],
};

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 min-w-40 flex-col gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function ApplicantForm({
  applicantId,
  defaultValues,
}: {
  applicantId?: string;
  defaultValues?: Partial<ApplicantFormValues>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(applicantFormSchema),
    defaultValues: { ...DEFAULT_VALUES, ...defaultValues },
  });

  const { register, handleSubmit, control, watch, setValue, formState } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "employmentHistory",
  });

  function onSubmit(values: ApplicantFormValues) {
    startTransition(async () => {
      try {
        if (applicantId) {
          await updateApplicant(applicantId, values);
          toast.success("Profile saved");
          router.refresh();
        } else {
          await createApplicant(values);
          // createApplicant redirects on success; nothing else to do here.
        }
      } catch {
        toast.error("Could not save profile");
      }
    });
  }

  const checkbox = (name: keyof ApplicantFormValues, label: string) => (
    <label className="flex items-center gap-2 text-sm font-medium">
      <Checkbox
        checked={!!watch(name)}
        onCheckedChange={(v) => setValue(name, !!v as never)}
      />
      {label}
    </label>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {/* Reference + Role */}
      <Card>
        <CardHeader>
          <CardTitle>Identity &amp; role</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <FieldGroup label="Reference no.">
            <Input placeholder="e.g. A 02" {...register("refNo")} />
          </FieldGroup>
          <FieldGroup label="Candidate name">
            <Input placeholder="e.g. M.I Rilmiya" {...register("name")} />
            {formState.errors.name && (
              <p className="text-xs text-destructive">{formState.errors.name.message}</p>
            )}
          </FieldGroup>
          <FieldGroup label="Role / position">
            <Select value={watch("role")} onValueChange={(v) => setValue("role", v ?? "")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>
          <FieldGroup label="Contract period">
            <Select value={watch("contract")} onValueChange={(v) => setValue("contract", v ?? "")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTRACT_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-x-6 gap-y-3">
          {checkbox("skillCleaning", "Cleaning")}
          {checkbox("skillWashing", "Washing")}
          {checkbox("skillBabysitting", "Baby sitting")}
          {checkbox("skillCooking", "Arabic cooking")}
          {checkbox("skillDriving", "Driving")}
        </CardContent>
      </Card>

      {/* Personal information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal information</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <FieldGroup label="Nationality">
            <Select
              value={watch("nationality") || null}
              onValueChange={(v) => setValue("nationality", v ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {NATIONALITY_OPTIONS.map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>
          <FieldGroup label="Religion">
            <Select
              value={watch("religion") || null}
              onValueChange={(v) => setValue("religion", v ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {RELIGION_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>
          <FieldGroup label="Date of birth">
            <Input type="date" {...register("dateOfBirth")} />
          </FieldGroup>
          <FieldGroup label="Age">
            <Input type="number" min={16} max={65} {...register("age")} />
          </FieldGroup>
          <FieldGroup label="Height (cm)">
            <Input type="number" {...register("heightCm")} />
          </FieldGroup>
          <FieldGroup label="Weight (kg)">
            <Input type="number" {...register("weightKg")} />
          </FieldGroup>
          <FieldGroup label="Marital status">
            <Select
              value={watch("maritalStatus") || null}
              onValueChange={(v) => setValue("maritalStatus", (v ?? "") as never)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MARITAL_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>
          <FieldGroup label="Children (no.)">
            <Input type="number" min={0} {...register("children")} />
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Passport */}
      <Card>
        <CardHeader>
          <CardTitle>Passport details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <FieldGroup label="Passport no.">
            <Input placeholder="e.g. N1234567" {...register("passportNo")} />
          </FieldGroup>
          <FieldGroup label="Place of issue">
            <Input placeholder="e.g. Colombo" {...register("passportIssuedAt")} />
          </FieldGroup>
          <FieldGroup label="Date of issue">
            <Input type="date" {...register("passportIssueDate")} />
          </FieldGroup>
          <FieldGroup label="Date of expiry">
            <Input type="date" {...register("passportExpiryDate")} />
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader>
          <CardTitle>Educational qualification</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <FieldGroup label="Qualification">
            <Select
              value={watch("educationLevel") || null}
              onValueChange={(v) => setValue("educationLevel", v ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {EDUCATION_OPTIONS.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>
          <FieldGroup label="Year">
            <Input type="number" {...register("educationYear")} />
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Employment history */}
      <Card>
        <CardHeader>
          <CardTitle>Employment record</CardTitle>
          <CardDescription>Previous placements abroad, if any.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {fields.map((field, i) => (
            <div key={field.id} className="flex flex-wrap items-end gap-2">
              <FieldGroup label="Position">
                <Input
                  list="employment-position-options"
                  {...register(`employmentHistory.${i}.position`)}
                />
              </FieldGroup>
              <FieldGroup label="Country">
                <Input
                  list="employment-country-options"
                  {...register(`employmentHistory.${i}.country`)}
                />
              </FieldGroup>
              <FieldGroup label="Period">
                <Input placeholder="e.g. 2 yrs" {...register(`employmentHistory.${i}.period`)} />
              </FieldGroup>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(i)}
                aria-label="Remove row"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <datalist id="employment-position-options">
            {EMPLOYMENT_POSITION_OPTIONS.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
          <datalist id="employment-country-options">
            {EMPLOYMENT_COUNTRY_OPTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <Button
            type="button"
            variant="outline"
            className="self-start"
            onClick={() => append({ position: "", country: "", period: "" })}
          >
            <Plus className="size-4" />
            Add row
          </Button>
        </CardContent>
      </Card>

      {/* Languages */}
      <Card>
        <CardHeader>
          <CardTitle>Language skills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-x-6 gap-y-2 text-sm">
            <div />
            <div className="text-xs font-medium text-muted-foreground uppercase">Speaking</div>
            <div className="text-xs font-medium text-muted-foreground uppercase">Writing</div>
            <div className="font-semibold">English</div>
            {checkbox("englishSpeaking", "Speaking")}
            {checkbox("englishWriting", "Writing")}
            <div className="font-semibold">Arabic</div>
            {checkbox("arabicSpeaking", "Speaking")}
            {checkbox("arabicWriting", "Writing")}
          </div>
        </CardContent>
      </Card>

      {/* Internal contact — never exposed to agents */}
      <Card>
        <CardHeader>
          <CardTitle>Contact details</CardTitle>
          <CardDescription>Internal only — never shown to agents.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <FieldGroup label="Phone">
            <Input placeholder="+94 77 123 4567" {...register("phone")} />
          </FieldGroup>
          <FieldGroup label="WhatsApp">
            <Input placeholder="+94 77 123 4567" {...register("whatsapp")} />
          </FieldGroup>
          <FieldGroup label="Email">
            <Input type="email" placeholder="applicant@email.com" {...register("email")} />
          </FieldGroup>
          <FieldGroup label="Emergency contact">
            <Input placeholder="+94 71 987 6543" {...register("emergencyContact")} />
          </FieldGroup>
          <div className="w-full">
            <FieldGroup label="Home address">
              <Input placeholder="No. 12, Main Street, Colombo" {...register("address")} />
            </FieldGroup>
          </div>
        </CardContent>
      </Card>

      {/* PDF footer */}
      <Card>
        <CardHeader>
          <CardTitle>PDF footer lines</CardTitle>
          <CardDescription>Optional — overrides the organization default footer.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Textarea rows={1} placeholder="Line 1" {...register("footerLine1")} />
          <Textarea rows={1} placeholder="Line 2 (optional)" {...register("footerLine2")} />
          <Textarea rows={1} placeholder="Line 3 (optional)" {...register("footerLine3")} />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 pb-6">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : applicantId ? "Save changes" : "Create profile"}
        </Button>
      </div>
    </form>
  );
}
