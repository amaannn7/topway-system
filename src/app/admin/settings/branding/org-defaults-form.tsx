"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { toast } from "sonner";
import { orgDefaultsSchema, type OrgDefaultsValues } from "@/lib/validations/org-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Phone, Landmark } from "lucide-react";
import { saveOrgDefaults } from "./actions";

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-1 min-w-40 flex-col gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </Label>
      {children}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <CardHeader className="flex flex-row items-center gap-3 space-y-0">
      <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${className ?? "bg-primary/10 text-primary"}`}>
        <Icon className="size-4.5" />
      </div>
      <div>
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>
    </CardHeader>
  );
}

export function OrgDefaultsForm({ defaultValues }: { defaultValues: OrgDefaultsValues }) {
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit } = useForm({
    resolver: zodResolver(orgDefaultsSchema),
    defaultValues,
  });

  function onSubmit(values: OrgDefaultsValues) {
    startTransition(async () => {
      try {
        await saveOrgDefaults(values);
        toast.success("Defaults saved");
      } catch {
        toast.error("Could not save defaults");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Card className="shadow-sm">
        <SectionHeader
          icon={FileText}
          title="Applicant PDF footer"
          description="Default footer lines for candidate profile PDFs."
          className="bg-info/10 text-info"
        />
        <CardContent className="flex flex-col gap-3">
          <Input placeholder="Line 1" {...register("defaultFooterLine1")} />
          <Input placeholder="Line 2 (optional)" {...register("defaultFooterLine2")} />
          <Input placeholder="Line 3 (optional)" {...register("defaultFooterLine3")} />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <SectionHeader
          icon={Phone}
          title="Invoice footer contact"
          description="Shown at the bottom of every generated invoice."
          className="bg-amber/15 text-amber-foreground"
        />
        <CardContent className="flex flex-wrap gap-4">
          <FieldGroup label="Email">
            <Input {...register("invoiceFooterEmail")} />
          </FieldGroup>
          <FieldGroup label="Phone">
            <Input {...register("invoiceFooterPhone")} />
          </FieldGroup>
          <FieldGroup label="Fax">
            <Input {...register("invoiceFooterFax")} />
          </FieldGroup>
          <div className="w-full">
            <FieldGroup label="Address">
              <Input {...register("invoiceFooterAddress")} />
            </FieldGroup>
          </div>
          <FieldGroup label="Website">
            <Input {...register("invoiceFooterWebsite")} />
          </FieldGroup>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <SectionHeader
          icon={Landmark}
          title="Default bank details"
          description="Prefilled on every new invoice; can still be edited per invoice."
          className="bg-primary/10 text-primary"
        />
        <CardContent className="flex flex-wrap gap-4">
          <FieldGroup label="Bank name">
            <Input {...register("defaultBankName")} />
          </FieldGroup>
          <FieldGroup label="Account number">
            <Input {...register("defaultAccountNo")} />
          </FieldGroup>
          <FieldGroup label="Account name">
            <Input {...register("defaultAccountName")} />
          </FieldGroup>
          <FieldGroup label="SWIFT code">
            <Input {...register("defaultSwiftCode")} />
          </FieldGroup>
        </CardContent>
      </Card>

      <Button type="submit" disabled={pending} className="self-end">
        {pending ? "Saving…" : "Save defaults"}
      </Button>
    </form>
  );
}
