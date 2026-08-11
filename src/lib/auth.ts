import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

// Three principal types share one login surface split by `portal`:
//   - "admin"    -> AdminUser  (Topway staff, email + password)
//   - "agent"    -> Agent      (foreign recruitment agencies, username + password)
//   - "customer" -> Customer   (an agent's own sponsors/employers, agent-managed,
//                    username + password, scoped under one parent agentId)
// All three hash passwords with bcrypt and are looked up from Postgres via
// Prisma — this replaces the legacy single shared admin password and the
// agent's single mutable session-token-on-the-row model (Phase 1 §6).
export type PortalRole = "admin" | "agent" | "customer";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      portal: PortalRole;
      // Admin-only
      adminRole?: "OWNER" | "STAFF";
      canViewPayments?: boolean;
      // Agent-only
      company?: string;
      logoUrl?: string | null;
      // Customer-only — the parent agent this customer belongs to
      agentId?: string;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    portal: PortalRole;
    adminRole?: "OWNER" | "STAFF";
    canViewPayments?: boolean;
    company?: string;
    logoUrl?: string | null;
    agentId?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      id: "admin",
      name: "Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const admin = await prisma.adminUser.findUnique({
          where: { email: email.trim().toLowerCase() },
        });
        if (!admin || !admin.active) return null;

        const valid = await bcrypt.compare(password, admin.passwordHash);
        if (!valid) return null;

        return {
          id: admin.id,
          name: admin.name,
          portal: "admin" as const,
          adminRole: admin.role,
          canViewPayments: admin.canViewPayments,
        };
      },
    }),
    Credentials({
      id: "agent",
      name: "Agent",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!username || !password) return null;

        const agent = await prisma.agent.findUnique({
          where: { username: username.trim().toLowerCase() },
        });
        if (!agent || !agent.active) return null;

        const valid = await bcrypt.compare(password, agent.passwordHash);
        if (!valid) return null;

        return {
          id: agent.id,
          name: agent.name,
          portal: "agent" as const,
          company: agent.company,
          logoUrl: agent.logoUrl,
        };
      },
    }),
    Credentials({
      id: "customer",
      name: "Customer",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!username || !password) return null;

        const customer = await prisma.customer.findUnique({
          where: { username: username.trim().toLowerCase() },
          include: { agent: { select: { id: true, company: true, logoUrl: true } } },
        });
        if (!customer || !customer.active) return null;

        const valid = await bcrypt.compare(password, customer.passwordHash);
        if (!valid) return null;

        return {
          id: customer.id,
          name: customer.name,
          portal: "customer" as const,
          company: customer.agent.company,
          logoUrl: customer.agent.logoUrl,
          agentId: customer.agentId,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.portal = (user as { portal: PortalRole }).portal;
        token.adminRole = (user as { adminRole?: "OWNER" | "STAFF" }).adminRole;
        token.canViewPayments = (user as { canViewPayments?: boolean }).canViewPayments;
        token.company = (user as { company?: string }).company;
        token.logoUrl = (user as { logoUrl?: string | null }).logoUrl;
        token.agentId = (user as { agentId?: string }).agentId;
      }
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
  },
});
