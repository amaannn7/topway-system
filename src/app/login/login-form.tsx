"use client";

import { useActionState } from "react";
import { Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { LoginState } from "./actions";

function FieldIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
      {children}
    </span>
  );
}

const fieldInputClass =
  "h-11 rounded-xl border-transparent bg-muted/60 pl-10 shadow-none focus-visible:border-ring focus-visible:bg-background focus-visible:ring-4";

export function AdminLoginForm({
  action,
}: {
  action: (state: LoginState, formData: FormData) => Promise<LoginState>;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="relative">
        <FieldIcon>
          <Mail className="size-4" />
        </FieldIcon>
        <Input
          id="admin-email"
          name="email"
          type="email"
          placeholder="Email"
          autoComplete="username"
          required
          className={fieldInputClass}
        />
      </div>
      <div className="relative">
        <FieldIcon>
          <Lock className="size-4" />
        </FieldIcon>
        <Input
          id="admin-password"
          name="password"
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          required
          className={fieldInputClass}
        />
      </div>
      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        className="mt-2 h-11 w-full rounded-xl text-base shadow-sm"
        disabled={pending}
      >
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

// Purple to match the agent portal's own identity color used throughout
// AgentTopbar, the admin-side Agents section, etc.
export function AgentLoginForm({
  action,
}: {
  action: (state: LoginState, formData: FormData) => Promise<LoginState>;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="relative">
        <FieldIcon>
          <User className="size-4" />
        </FieldIcon>
        <Input
          id="agent-username"
          name="username"
          type="text"
          placeholder="Username"
          autoComplete="username"
          required
          className={cn(fieldInputClass, "focus-visible:ring-purple/30")}
        />
      </div>
      <div className="relative">
        <FieldIcon>
          <Lock className="size-4" />
        </FieldIcon>
        <Input
          id="agent-password"
          name="password"
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          required
          className={cn(fieldInputClass, "focus-visible:ring-purple/30")}
        />
      </div>
      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        className="mt-2 h-11 w-full rounded-xl bg-purple text-base text-purple-foreground shadow-sm hover:bg-purple/85"
        disabled={pending}
      >
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

// Same purple accent as AgentLoginForm — a customer is downstream of one
// sponsoring agent, so it shares that portal's identity color rather than
// introducing a fourth hue.
export function CustomerLoginForm({
  action,
}: {
  action: (state: LoginState, formData: FormData) => Promise<LoginState>;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="relative">
        <FieldIcon>
          <User className="size-4" />
        </FieldIcon>
        <Input
          id="customer-username"
          name="username"
          type="text"
          placeholder="Username"
          autoComplete="username"
          required
          className={cn(fieldInputClass, "focus-visible:ring-purple/30")}
        />
      </div>
      <div className="relative">
        <FieldIcon>
          <Lock className="size-4" />
        </FieldIcon>
        <Input
          id="customer-password"
          name="password"
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          required
          className={cn(fieldInputClass, "focus-visible:ring-purple/30")}
        />
      </div>
      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        className="mt-2 h-11 w-full rounded-xl bg-purple text-base text-purple-foreground shadow-sm hover:bg-purple/85"
        disabled={pending}
      >
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
