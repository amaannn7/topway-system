import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Server-side route protection, running on the Edge runtime — so this must
// use the Prisma-free authConfig (see auth.config.ts), not the full
// @/lib/auth which pulls in the Prisma client and cannot run on Edge.
//
// The legacy system only guarded pages client-side (a sessionStorage check
// that redirected on mount) while the actual data APIs (list.php, save.php,
// delete.php, upload.php) required no token at all — Phase 1 §6, the top
// security finding. Every /admin and /agent route is enforced here, before
// a page or API route handler runs; authConfig's `authorized` callback does
// the actual portal check and next-auth issues the redirect to /login.
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/admin/:path*", "/agent/:path*"],
};
