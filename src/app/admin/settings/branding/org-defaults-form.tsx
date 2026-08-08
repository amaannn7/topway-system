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
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Applicant PDF footer</CardTitle>
          <CardDescription>Default footer lines for candidate profile PDFs.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Input placeholder="Line 1" {...register("defaultFooterLine1")} />
          <Input placeholder="Line 2 (optional)" {...register("defaultFooterLine2")} />
          <Input placeholder="Line 3 (optional)" {...register("defaultFooterLine3")} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Invoice footer contact</CardTitle>
          <CardDescription>Shown at the bottom of every generated invoice.</CardDescription>
        </CardHeader>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Default bank details</CardTitle>
          <CardDescription>Prefilled on every new invoice — can still be edited per invoice.</CardDescription>
        </CardHeader>
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
