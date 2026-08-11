import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

// Edge-safe subset of the auth config, used only by middleware.ts.
// Next.js middleware runs on the Edge runtime, which cannot load the Prisma
// client (it needs Node built-ins like node:path/node:fs) — so this file
// must never import @/lib/prisma or the Credentials providers, only the
// JWT session shape needed to redirect unauthenticated requests.
export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    // Fallback only — authorized() below redirects explicitly per portal
    // (/login for admin, /login/agent for agent) so this rarely applies,
    // but next-auth requires a value here for its own internal error pages.
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    // Mirrors the same-named callbacks in auth.ts. Both instances must
    // shape the JWT/session identically — auth.ts populates token.portal
    // at sign-in time (Node runtime), and this copy re-projects it onto
    // `session.user` when middleware (Edge runtime) decodes that same
    // token on every request. Without this, `authorized()` below always
    // sees `auth.user.portal` as undefined even for a valid session.
    async jwt({ token }) {
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.portal = token.portal;
      session.user.adminRole = token.adminRole;
      session.user.canViewPayments = token.canViewPayments;
      session.user.company = token.company;
      session.user.logoUrl = token.logoUrl;
      session.user.agentId = token.agentId;
      return session;
    },
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl;
      const portal = auth?.user?.portal;

      // Each portal has its own login page (distinct branding + credential
      // shape), so redirect explicitly here rather than relying on the
      // single static `pages.signIn` target above.
      if (pathname.startsWith("/admin")) {
        if (portal === "admin") return true;
        return NextResponse.redirect(new URL("/login", request.url));
      }
      if (pathname.startsWith("/agent")) {
        if (portal === "agent") return true;
        return NextResponse.redirect(new URL("/login/agent", request.url));
      }
      if (pathname.startsWith("/customer")) {
        if (portal === "customer") return true;
        return NextResponse.redirect(new URL("/login/customer", request.url));
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
