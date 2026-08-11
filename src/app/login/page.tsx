import Image from "next/image";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { adminLoginAction } from "./actions";
import { AdminLoginForm } from "./login-form";

// Staff/admin sign-in — a separate page from /login/agent (distinct branding,
// distinct credential shape: email+password vs. an agency username+password).
// Kept at the bare /login path since that's next-auth's configured
// `pages.signIn` redirect target (see auth.config.ts) for the /admin/* matcher.
export default function AdminLoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-secondary/40 via-primary/15 to-background px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklch,var(--secondary),transparent_45%),transparent_60%)]"
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
          <LogIn className="size-5 text-primary" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Sign in to Topway</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Staff and admin access to the applicant pipeline.
        </p>

        <div className="mt-6 text-left">
          <AdminLoginForm action={adminLoginAction} />
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Forgot your password? Ask an owner to reset it from Settings → Team.
        </p>

        <div className="mt-6 border-t border-border/60 pt-4">
          <p className="text-sm text-muted-foreground">
            Recruitment agency?{" "}
            <Link href="/login/agent" className="font-medium text-primary hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
