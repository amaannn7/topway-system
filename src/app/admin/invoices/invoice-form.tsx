"use client";

import { useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { invoiceFormSchema, type InvoiceFormValues } from "@/lib/validations/invoice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createInvoice, updateInvoice } from "./actions";

const CURRENCIES = ["KD", "USD", "SAR", "AED", "QAR", "BHD", "OMR", "EUR"] as const;
const TITLES = ["MR.", "MRS.", "MS.", "DR.", "COMPANY"] as const;
const PAYMENT_METHODS = ["REMITTANCE", "BANK TRANSFER", "CASH", "CHEQUE", "WIRE TRANSFER"] as const;

function FieldGroup({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-1 min-w-32 flex-col gap-1.5 ${className ?? ""}`}>
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function InvoiceForm({
  invoiceId,
  defaultValues,
  agents,
}: {
  invoiceId?: string;
  defaultValues?: Partial<InvoiceFormValues>;
  agents: { id: string; name: string; company: string; country: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoiceNo: "",
      invoicedDate: new Date().toISOString().slice(0, 10),
      currency: "KD",
      agentId: null,
      billToTitle: "MR.",
      billToCompany: "",
      billToPurpose: "For Recruitment of Domestic Manpower",
      billToLicenseNo: "",
      serviceType: "HOUSEMAID WORKERS",
      workers: [{ name: "", qty: 1, amount: 0 }],
      advanceStatus: "NONE",
      advanceAmount: 0,
      total: 0,
      paymentMethod: "REMITTANCE",
      bankName: "",
      accountNo: "",
      accountName: "",
      swiftCode: "",
      notes: "",
      footerEmail: "",
      footerPhone: "",
      footerFax: "",
      footerAddress: "",
      footerWebsite: "",
      ...defaultValues,
    },
  });

  const { register, handleSubmit, control, watch, setValue, formState } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "workers" });

  const workers = watch("workers");
  const advanceStatus = watch("advanceStatus");
  const advanceAmount = watch("advanceAmount");
  const currency = watch("currency");

  const calculatedTotal = useMemo(() => {
    const subtotal = workers.reduce((sum, w) => sum + (Number(w.amount) || 0) * (Number(w.qty) || 1), 0);
    const advance = advanceStatus === "PAID" ? Number(advanceAmount) || 0 : 0;
    return Math.max(0, subtotal - advance);
  }, [workers, advanceStatus, advanceAmount]);

  // Auto-fill total unless the user has typed a custom value — same "you
  // can still override the calculated number" UX as the legacy form
  // (Phase 1 noted the legacy stored whatever was typed with no
  // guarantee it matched; here `total` is always a real Decimal but the
  // auto-fill/override behavior is preserved).
  const totalTouched = formState.dirtyFields.total;
  useEffect(() => {
    if (!totalTouched) setValue("total", calculatedTotal);
  }, [calculatedTotal, totalTouched, setValue]);

  function selectAgent(agentId: string) {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return;
    setValue("agentId", agentId);
    setValue("billToCompany", agent.company.toUpperCase());
    setValue("billToTitle", "COMPANY");
  }

  function onSubmit(values: InvoiceFormValues) {
    startTransition(async () => {
      try {
        if (invoiceId) {
          await updateInvoice(invoiceId, values);
          toast.success("Invoice saved");
          router.push(`/admin/invoices/${invoiceId}`);
        } else {
          await createInvoice(values);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not save invoice");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Invoice details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <FieldGroup label="Invoice no.">
            <Input placeholder="01" {...register("invoiceNo")} />
            {formState.errors.invoiceNo && (
              <p className="text-xs text-destructive">{formState.errors.invoiceNo.message}</p>
            )}
          </FieldGroup>
          <FieldGroup label="Invoice date">
            <Input type="date" {...register("invoicedDate")} />
          </FieldGroup>
          <FieldGroup label="Currency">
            <Select value={watch("currency")} onValueChange={(v) => setValue("currency", (v ?? "KD") as never)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bill to</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {agents.length > 0 && (
            <FieldGroup label="Select agent (optional — autofills fields below)">
              <Select value={watch("agentId") ?? null} onValueChange={(v) => v && selectAgent(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Type manually or select an agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} — {a.company} ({a.country})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>
          )}
          <div className="flex flex-wrap gap-4">
            <FieldGroup label="Title" className="max-w-28">
              <Select value={watch("billToTitle")} onValueChange={(v) => setValue("billToTitle", (v ?? "MR.") as never)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TITLES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>
            <FieldGroup label="Company / name">
              <Input placeholder="e.g. BOOM AL-KUWAIT" {...register("billToCompany")} />
              {formState.errors.billToCompany && (
                <p className="text-xs text-destructive">{formState.errors.billToCompany.message}</p>
              )}
            </FieldGroup>
          </div>
          <FieldGroup label="Purpose">
            <Input {...register("billToPurpose")} />
          </FieldGroup>
          <FieldGroup label="License number (optional)">
            <Input placeholder="Leave blank if none" {...register("billToLicenseNo")} />
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Services / workers</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <FieldGroup label="Service type">
            <Input {...register("serviceType")} />
          </FieldGroup>

          <div className="flex flex-col gap-2">
            {fields.map((field, i) => (
              <div key={field.id} className="flex flex-wrap items-end gap-2">
                <FieldGroup label="Worker name" className="min-w-40">
                  <Input placeholder="Worker name" {...register(`workers.${i}.name`)} />
                </FieldGroup>
                <FieldGroup label="Qty" className="max-w-20">
                  <Input type="number" min={1} {...register(`workers.${i}.qty`)} />
                </FieldGroup>
                <FieldGroup label="Amount" className="max-w-32">
                  <Input type="number" min={0} step="0.01" {...register(`workers.${i}.amount`)} />
                </FieldGroup>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(i)}
                  disabled={fields.length === 1}
                  aria-label="Remove worker"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            {formState.errors.workers?.message && (
              <p className="text-xs text-destructive">{formState.errors.workers.message}</p>
            )}
            <Button
              type="button"
              variant="outline"
              className="self-start"
              onClick={() => append({ name: "", qty: 1, amount: 0 })}
            >
              <Plus className="size-4" />
              Add worker
            </Button>
          </div>

          <div className="flex items-center gap-4 border-t pt-4">
            <FieldGroup label="Advance">
              <Select
                value={watch("advanceStatus")}
                onValueChange={(v) => setValue("advanceStatus", (v ?? "NONE") as never)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">None</SelectItem>
                  <SelectItem value="REQUESTED">Requested</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                </SelectContent>
              </Select>
            </FieldGroup>
            <FieldGroup label="Advance amount" className="max-w-40">
              <Input
                type="number"
                min={0}
                step="0.01"
                disabled={advanceStatus === "NONE"}
                {...register("advanceAmount")}
              />
            </FieldGroup>
          </div>

          <div className="flex items-center justify-end gap-2 border-t pt-3 text-sm text-muted-foreground">
            <span>Calculated total:</span>
            <strong className="text-base text-foreground tabular-nums">
              {currency} {calculatedTotal.toLocaleString()}
            </strong>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment summary</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <FieldGroup label="Total amount shown on invoice">
            <Input type="number" min={0} step="0.01" {...register("total")} />
          </FieldGroup>
          <FieldGroup label="Payment method" className="max-w-48">
            <Select
              value={watch("paymentMethod")}
              onValueChange={(v) => setValue("paymentMethod", (v ?? "REMITTANCE") as never)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bank details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <FieldGroup label="Bank name">
            <Input {...register("bankName")} />
          </FieldGroup>
          <FieldGroup label="Account number" className="max-w-48">
            <Input {...register("accountNo")} />
          </FieldGroup>
          <FieldGroup label="Account name">
            <Input {...register("accountName")} />
          </FieldGroup>
          <FieldGroup label="SWIFT code" className="max-w-40">
            <Input {...register("swiftCode")} />
          </FieldGroup>
          <div className="w-full">
            <FieldGroup label="Notes (optional — appears in footer)">
              <Textarea rows={2} {...register("notes")} />
            </FieldGroup>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Topway footer details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <FieldGroup label="Email">
            <Input {...register("footerEmail")} />
          </FieldGroup>
          <FieldGroup label="Phone">
            <Input {...register("footerPhone")} />
          </FieldGroup>
          <FieldGroup label="Fax">
            <Input {...register("footerFax")} />
          </FieldGroup>
          <div className="w-full">
            <FieldGroup label="Address">
              <Input {...register("footerAddress")} />
            </FieldGroup>
          </div>
          <FieldGroup label="Website">
            <Input {...register("footerWebsite")} />
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 pb-6">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : invoiceId ? "Save changes" : "Create invoice"}
        </Button>
      </div>
    </form>
  );
}
