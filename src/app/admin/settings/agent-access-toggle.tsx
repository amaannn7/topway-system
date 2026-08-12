"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import { saveOrgSettings } from "@/app/admin/agents/actions";

export function AgentAccessToggle({ initialValue }: { initialValue: boolean }) {
  const [checked, setChecked] = useState(initialValue);
  const [pending, startTransition] = useTransition();

  function handleChange(next: boolean) {
    setChecked(next);
    startTransition(async () => {
      try {
        await saveOrgSettings(next);
        toast.success(
          next ? "Agents can now browse and request profiles" : "Agents limited to assigned profiles"
        );
      } catch {
        setChecked(!next);
        toast.error("Could not update setting");
      }
    });
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-center justify-between gap-4 py-4">
        <div className="flex items-center gap-3.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Users className="size-4.5" />
          </div>
          <div>
            <p className="text-sm font-medium">Agent browse &amp; request access</p>
            <p className="text-xs text-muted-foreground">
              When off, agents only see applicants explicitly assigned to their account.
            </p>
          </div>
        </div>
        <Switch checked={checked} onCheckedChange={handleChange} disabled={pending} />
      </CardContent>
    </Card>
  );
}
