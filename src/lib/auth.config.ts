import type { NextAuthConfig } from "next-auth";

// Edge-safe subset of the auth config, used only by middleware.ts.
// Next.js middleware runs on the Edge runtime, which cannot load the Prisma
// client (it needs Node built-ins like node:path/node:fs) — so this file
// must never import @/lib/prisma or the Credentials providers, only the
// JWT session shape needed to redirect unauthenticated requests.
export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
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
      session.user.company = token.company;
      session.user.logoUrl = token.logoUrl;
      return session;
    },
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl;
      const portal = auth?.user?.portal;

      if (pathname.startsWith("/admin")) return portal === "admin";
      if (pathname.startsWith("/agent")) return portal === "agent";
      return true;
    },
  },
} satisfies NextAuthConfig;
