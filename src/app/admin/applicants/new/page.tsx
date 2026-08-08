import { ApplicantForm } from "../applicant-form";

export default function NewApplicantPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New applicant profile</h1>
        <p className="text-sm text-muted-foreground">
          Once saved, you&apos;ll land on the pipeline tab to start tracking processing steps.
        </p>
      </div>
      <ApplicantForm />
    </div>
  );
}
