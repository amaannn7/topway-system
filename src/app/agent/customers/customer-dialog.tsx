"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { customerFormSchema, type CustomerFormValues } from "@/lib/validations/customer";
import { Button } from "@/components/ui/button";
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
import { createCustomer, updateCustomer } from "./actions";

export function CustomerDialog({
  customerId,
  defaultValues,
  trigger,
}: {
  customerId?: string;
  defaultValues?: Partial<CustomerFormValues>;
  trigger?: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const { register, handleSubmit, watch, setValue, formState, reset } = useForm({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      companyName: "",
      username: "",
      password: "",
      active: true,
      ...defaultValues,
    },
  });

  function onSubmit(values: CustomerFormValues) {
    startTransition(async () => {
      try {
        if (customerId) {
          await updateCustomer(customerId, values);
          toast.success("Customer saved");
        } else {
          await createCustomer(values);
          toast.success("Customer account created");
          reset();
        }
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not save customer");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button size="lg" className="rounded-full px-4">
              <Plus className="size-4" />
              Add customer
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{customerId ? "Edit customer" : "Add customer account"}</DialogTitle>
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
            <Label>Company</Label>
            <Input placeholder="Optional" {...register("companyName")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Username</Label>
            <Input {...register("username")} />
            {formState.errors.username && (
              <p className="text-xs text-destructive">{formState.errors.username.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{customerId ? "New password" : "Password"}</Label>
            <Input
              type="password"
              placeholder={customerId ? "Leave blank to keep existing" : "At least 8 characters"}
              autoComplete="new-password"
              {...register("password")}
            />
            {formState.errors.password && (
              <p className="text-xs text-destructive">{formState.errors.password.message}</p>
            )}
          </div>
          <label className="group/field flex items-center gap-2.5 text-sm">
            <Checkbox
              checked={!!watch("active")}
              onCheckedChange={(v) => setValue("active", !!v)}
            />
            Active
          </label>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : customerId ? "Save changes" : "Create account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditCustomerTrigger() {
  return (
    <Button variant="ghost" size="icon" aria-label="Edit customer">
      <Pencil className="size-4" />
    </Button>
  );
}
