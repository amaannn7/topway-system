import { Button } from "@/components/ui/button";

export function DownloadCvButton({
  applicantId,
  applicantName,
  children,
}: {
  applicantId: string;
  applicantName: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full"
      render={
        <a
          href={`/agent/applicants/${applicantId}/cv`}
          aria-label={`Download CV for ${applicantName || "applicant"}`}
        />
      }
    >
      {children}
    </Button>
  );
}
