import { AgentForm } from "../agent-form";

export default function NewAgentPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add agent</h1>
        <p className="text-sm text-muted-foreground">
          They&apos;ll sign in at the agent portal with the username and password below.
        </p>
      </div>
      <AgentForm />
    </div>
  );
}
