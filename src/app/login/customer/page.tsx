import Image from "next/image";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { customerLoginAction } from "../actions";
import { CustomerLoginForm } from "../login-form";

// Customer (sponsor/employer) sign-in — same purple identity as the agent
// portal, since a customer is downstream of one sponsoring agent. Distinct
// page from /login/agent because the credential shape and destination
// (/customer/applicants, read-only) are different.
export default function CustomerLoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-purple/35 via-purple/15 to-background px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklch,var(--purple),transparent_45%),transparent_60%)]"
      />
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <Image
          src="/brand/topway-logo.png"
          alt="Topway"
          width={28}
          height={28}
          className="size-7 rounded-md object-contain"
        />
        <span className="text-sm font-semibold">Topway</span>
      </div>

      <div className="relative w-full max-w-sm rounded-3xl bg-card/70 p-8 text-center shadow-xl ring-1 ring-foreground/10 backdrop-blur-xl">
        <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-b from-card to-muted shadow-sm ring-1 ring-foreground/10">
          <LogIn className="size-5 text-purple" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Customer sign in</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          View candidate profiles shared with you.
        </p>

        <div className="mt-6 text-left">
          <CustomerLoginForm action={customerLoginAction} />
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Forgot your password? Contact your agency to have it reset.
        </p>

        <div className="mt-6 border-t border-border/60 pt-4">
          <p className="text-sm text-muted-foreground">
            Recruitment agency?{" "}
            <Link href="/login/agent" className="font-medium text-purple hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
