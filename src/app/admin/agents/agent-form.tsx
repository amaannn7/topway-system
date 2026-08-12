"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { agentFormSchema, type AgentFormValues } from "@/lib/validations/agent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, KeyRound } from "lucide-react";
import { createAgent, updateAgent } from "./actions";

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
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  className?: string;
}) {
  return (
    <CardHeader className="flex flex-row items-center gap-3 space-y-0">
      <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${className ?? "bg-primary/10 text-primary"}`}>
        <Icon className="size-4.5" />
      </div>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
  );
}

export function AgentForm({
  agentId,
  defaultValues,
}: {
  agentId?: string;
  defaultValues?: Partial<AgentFormValues>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(agentFormSchema),
    defaultValues: {
      name: "",
      company: "",
      country: "",
      username: "",
      password: "",
      active: true,
      ...defaultValues,
    },
  });

  const { register, handleSubmit, watch, setValue, formState } = form;

  function onSubmit(values: AgentFormValues) {
    startTransition(async () => {
      try {
        if (agentId) {
          await updateAgent(agentId, values);
          toast.success("Agent saved");
          router.push(`/admin/agents/${agentId}`);
        } else {
          await createAgent(values);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not save agent");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <Card className="shadow-sm">
        <SectionHeader icon={Building2} title="Agency details" className="bg-primary/10 text-primary" />
        <CardContent className="flex flex-wrap gap-4">
          <FieldGroup label="Contact name">
            <Input placeholder="e.g. Mohammed Al-Hassan" {...register("name")} />
            {formState.errors.name && (
              <p className="text-xs text-destructive">{formState.errors.name.message}</p>
            )}
          </FieldGroup>
          <FieldGroup label="Company name">
            <Input placeholder="e.g. Al Hamra Agency" {...register("company")} />
            {formState.errors.company && (
              <p className="text-xs text-destructive">{formState.errors.company.message}</p>
            )}
          </FieldGroup>
          <FieldGroup label="Country">
            <Input placeholder="e.g. Saudi Arabia" {...register("country")} />
            {formState.errors.country && (
              <p className="text-xs text-destructive">{formState.errors.country.message}</p>
            )}
          </FieldGroup>
          <FieldGroup label="Status">
            <Select
              value={watch("active") ? "active" : "inactive"}
              onValueChange={(v) => setValue("active", v === "active")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <SectionHeader icon={KeyRound} title="Login credentials" className="bg-info/10 text-info" />
        <CardContent className="flex flex-wrap gap-4">
          <FieldGroup label="Username">
            <Input placeholder="e.g. alhamra" autoComplete="off" {...register("username")} />
            {formState.errors.username && (
              <p className="text-xs text-destructive">{formState.errors.username.message}</p>
            )}
          </FieldGroup>
          <FieldGroup label={agentId ? "New password" : "Password"}>
            <Input
              type="password"
              placeholder={agentId ? "Leave blank to keep existing" : "At least 8 characters"}
              autoComplete="new-password"
              {...register("password")}
            />
            {formState.errors.password && (
              <p className="text-xs text-destructive">{formState.errors.password.message}</p>
            )}
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 pb-6">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : agentId ? "Save changes" : "Create agent"}
        </Button>
      </div>
    </form>
  );
}
