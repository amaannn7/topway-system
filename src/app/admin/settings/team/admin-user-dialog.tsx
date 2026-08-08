"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { adminUserFormSchema, type AdminUserFormValues } from "@/lib/validations/admin-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { createAdminUser, updateAdminUser } from "./actions";

export function AdminUserDialog({
  userId,
  defaultValues,
  trigger,
}: {
  userId?: string;
  defaultValues?: Partial<AdminUserFormValues>;
  trigger?: React.ReactElement;
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
      ...defaultValues,
    },
  });

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
        render={
          trigger ?? (
            <Button size="sm">
              <Plus className="size-4" />
              Add account
            </Button>
          )
        }
      />
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

export function EditAdminUserTrigger() {
  return (
    <Button variant="ghost" size="icon" aria-label="Edit account">
      <Pencil className="size-4" />
    </Button>
  );
}
