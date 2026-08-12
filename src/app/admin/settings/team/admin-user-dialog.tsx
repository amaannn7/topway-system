"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { adminUserFormSchema, type AdminUserFormValues } from "@/lib/validations/admin-user";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createAdminUser, updateAdminUser } from "./actions";

// Trigger is styled via `buttonVariants` classes applied straight to
// DialogTrigger's native <button> rather than nesting a <Button> through
// `render` — see PdfPreviewDialog's comment: two styled primitives each
// stamping their own `data-slot` onto the same node breaks the trigger.
export function AdminUserDialog({
  userId,
  defaultValues,
  triggerVariant = "default",
  triggerSize = "lg",
  triggerClassName,
  triggerLabel = "Add account",
  triggerIconOnly = false,
  triggerAriaLabel,
}: {
  userId?: string;
  defaultValues?: Partial<AdminUserFormValues>;
  triggerVariant?: React.ComponentProps<typeof Button>["variant"];
  triggerSize?: React.ComponentProps<typeof Button>["size"];
  triggerClassName?: string;
  triggerLabel?: string;
  triggerIconOnly?: boolean;
  triggerAriaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const { register, handleSubmit, watch, setValue, formState, reset } = useForm({
    resolver: zodResolver(adminUserFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "STAFF" as const,
      active: true,
      canViewPayments: false,
      ...defaultValues,
    },
  });

  const role = watch("role");

  function onSubmit(values: AdminUserFormValues) {
    startTransition(async () => {
      try {
        if (userId) {
          await updateAdminUser(userId, values);
          toast.success("Account saved");
        } else {
          await createAdminUser(values);
          toast.success("Account created");
          reset();
        }
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not save account");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(buttonVariants({ variant: triggerVariant, size: triggerSize }), triggerClassName)}
        aria-label={triggerIconOnly ? (triggerAriaLabel ?? triggerLabel) : undefined}
      >
        {userId ? <Pencil className="size-4" /> : <Plus className="size-4" />}
        {!triggerIconOnly && triggerLabel}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{userId ? "Edit account" : "Add staff account"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Name</Label>
            <Input {...register("name")} />
            {formState.errors.name && (
              <p className="text-xs text-destructive">{formState.errors.name.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Email</Label>
            <Input type="email" {...register("email")} />
            {formState.errors.email && (
              <p className="text-xs text-destructive">{formState.errors.email.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{userId ? "New password" : "Password"}</Label>
            <Input
              type="password"
              placeholder={userId ? "Leave blank to keep existing" : "At least 8 characters"}
              autoComplete="new-password"
              {...register("password")}
            />
            {formState.errors.password && (
              <p className="text-xs text-destructive">{formState.errors.password.message}</p>
            )}
          </div>
          <div className="flex gap-4">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label>Role</Label>
              <Select value={watch("role")} onValueChange={(v) => setValue("role", (v ?? "STAFF") as never)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OWNER">Owner</SelectItem>
                  <SelectItem value="STAFF">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label>Status</Label>
              <Select
                value={watch("active") ? "active" : "inactive"}
                onValueChange={(v) => setValue("active", v === "active")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {role !== "OWNER" && (
            <label className="group/field flex items-center gap-2.5 text-sm">
              <Checkbox
                checked={!!watch("canViewPayments")}
                onCheckedChange={(v) => setValue("canViewPayments", !!v)}
              />
              <span>
                Can view payment information
                <span className="block text-xs text-muted-foreground">
                  Invoice totals, advances, and bank details. Owners always have access.
                </span>
              </span>
            </label>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : userId ? "Save changes" : "Create account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
