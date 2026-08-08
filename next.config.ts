import type { NextConfig } from "next";

// Legacy .htaccess set nosniff/frame-options/referrer-policy but nothing
// enforced authentication server-side (Phase 1 §6). This carries those
// headers forward application-wide and adds a couple more that a static
// .htaccess couldn't express as cleanly (CSP frame-ancestors, permissions
// policy) — same defensive intent, applied via Next's headers() so it
// covers every response, not just the ones Apache happened to serve.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
