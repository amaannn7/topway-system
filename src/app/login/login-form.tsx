"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LoginState } from "./actions";

export function AdminLoginForm({
  action,
}: {
  action: (state: LoginState, formData: FormData) => Promise<LoginState>;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="admin-email">Email</Label>
        <Input
          id="admin-email"
          name="email"
          type="email"
          placeholder="you@topway.lk"
          autoComplete="username"
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="admin-password">Password</Label>
        <Input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

export function AgentLoginForm({
  action,
}: {
  action: (state: LoginState, formData: FormData) => Promise<LoginState>;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="agent-username">Username</Label>
        <Input
          id="agent-username"
          name="username"
          type="text"
          placeholder="your-agency"
          autoComplete="username"
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="agent-password">Password</Label>
        <Input
          id="agent-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
