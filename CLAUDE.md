@AGENTS.md

# Topway Portal

A Next.js rebuild of Topway's recruitment-agency backoffice, replacing a
legacy PHP/jQuery system (`portal.topway.lk`) that used file-backed JSON
"databases" and a single shared admin password. This app is Postgres +
Prisma + NextAuth, with role-scoped portals for staff and external
recruitment agencies.

## Two portals, two logins

There are two completely separate authenticated areas, gated by
`portal: "admin" | "agent"` on the session (see `src/lib/auth.ts`):

- **`/admin/*`** — Topway staff. Manages applicant profiles, agents,
  invoices, and settings.
- **`/agent/*`** — external recruitment agencies. Each agent only sees
  applicants assigned to them (or, if `OrgSettings.allowAgentBrowse` is on,
  can browse and request additional profiles).

Each portal has its **own login page** — not a shared page with a tab
switcher:

- `/login` — staff sign-in (email + password), teal-branded.
- `/login/agent` — agency sign-in (username + password), purple-branded to
  match the agent portal's own accent color.

Routing between them is enforced in `src/lib/auth.config.ts`'s `authorized()`
callback (runs in `src/proxy.ts`, matcher `["/admin/:path*", "/agent/:path*"]`):
an unauthenticated request to `/admin/*` redirects to `/login`, an
unauthenticated request to `/agent/*` redirects to `/login/agent`. Sign-out
(`src/app/actions.ts`'s `signOutAction`) reads the current session's `portal`
before calling `signOut()` so each user lands back on their own login page,
not the other portal's.

`src/lib/auth.config.ts` is a Prisma-free subset of `src/lib/auth.ts`,
because Next.js middleware runs on the Edge runtime and can't load the
Prisma client. Both files' `jwt`/`session` callbacks must stay in sync — the
Node-runtime `auth.ts` populates `token.portal` etc. at sign-in, and the
Edge-runtime `auth.config.ts` re-projects the same fields onto
`session.user` on every request middleware decodes.

## Data model

Prisma schema at `prisma/schema.prisma`, Postgres via `@prisma/adapter-pg`.
Key models:

- `AdminUser` (`OWNER`/`STAFF` role) and `Agent` — the two credentialed
  principal types, each with their own bcrypt-hashed password.
- `Applicant` — the core record. Personal/passport/education/skills fields,
  plus a fixed 6-step processing pipeline (`PipelineStep`: Medical → Enjaz →
  Bureau → Wakalah → Embassy → Payment, in that order) and separate
  `ticketDate` / `saudiAgentVisaDate` milestones tracked outside the 6 steps.
  `deriveStatus()` in `src/lib/pipeline-status.ts` is the single source of
  truth for turning pipeline state into a display status
  (READY/COMPLETE/PROGRESS/PENDING/SENT/CANCELLED) — don't recompute this
  inline, both portals' UIs import it.
- `AgentAssignment` — which applicants an agent can see (admin-controlled).
- `AgentRequest` — an agent's request to be assigned a profile, via
  Browse & Request; admin approves/rejects from `/admin/requests`.
- `Invoice` / `InvoiceWorker` — billing records, PDF-rendered on demand.
- `OrgSettings` — a singleton row (`id: "singleton"`) for org-wide config
  (branding, `allowAgentBrowse`, PDF footer defaults, bank details).
- `AuditLog` — written by `src/lib/audit.ts`, surfaced at
  `/admin/settings/audit-log`.

Legacy data migration lives in `scripts/migrate-legacy-data.mjs` (one-off,
already run — see git history "Migrate real legacy data").

## PDFs

Two PDF types, both server-rendered with `@react-pdf/renderer` (not
html2canvas/jsPDF screenshots like the legacy system):

- Invoice PDF: `src/lib/invoice-pdf.tsx`, served from
  `/admin/invoices/[id]/pdf`.
- Applicant CV PDF: `src/lib/cv-pdf.tsx`, served from
  `/admin/applicants/[id]/cv` (admin) and `/agent/applicants/[id]/cv` (agent,
  gated to only their assigned profiles).

Both portals preview these through the shared `PdfPreviewDialog`
(`src/components/pdf-preview-dialog.tsx`): it `fetch()`es the PDF route into
a blob and shows it in an `<iframe>`, with a Download button alongside. The
dialog trigger is styled via `buttonVariants()` classes applied straight to
`DialogTrigger`, not by nesting a `<Button>` element through `render` —
nesting two styled primitives that way previously caused a client/server
hydration mismatch on `data-slot`. Don't reintroduce that pattern; if a
future trigger needs button styling, pass `triggerVariant`/`triggerSize`/
`triggerClassName` props into `PdfPreviewDialog` the way existing call sites
do.

## UI conventions

Tailwind v4 + shadcn (`components.json`) + Base UI React primitives
(`@base-ui/react`, not Radix). Primitives live in `src/components/ui/*`.

**Color tokens** (`src/app/globals.css`, OKLCH, both `:root` and `.dark`
defined): `--primary` (Topway teal) is the brand/CTA color, used for
navigation active-states and default buttons. Additional semantic
entity-accent tokens exist for visually distinguishing sections at a
glance — extend this set rather than inventing ad hoc colors:

| Token | Hue | Used for |
|---|---|---|
| `--success` / `--warning` / `--destructive` | green / amber / red | status semantics (existing shadcn set) |
| `--info` | blue | Applicants section |
| `--purple` | purple | Agents section (admin side) and the entire agent portal's own identity (topbar, avatar, login page) |
| `--amber` | amber/orange | Invoices section |

Requests intentionally has no dedicated hue — it's an approve/reject queue,
styled with `--warning` (pending-decision framing).

**Color consumption pattern**: this codebase does *not* add new `Badge`/
`Button` CVA variants for one-off semantic colors. Instead it uses a local
`Record<Status, string>` className lookup map per file (see
`STATUS_STYLES` in `applicant-status-badge.tsx`, `DELAY_STYLES` in
`applicants-table.tsx`, `ACTION_STYLES` in `settings/audit-log/page.tsx`) —
follow this pattern for new per-category coloring rather than modifying the
shared `badge.tsx`/`button.tsx` primitives.

**Sidebar**: `src/components/admin/admin-sidebar.tsx` is intentionally
flush/full-height/bordered (`Sidebar collapsible="icon"`, no `variant`
prop — do not set `variant="floating"` or `"inset"`). This was tried and
explicitly reverted; keep the shape as-is even when restyling colors.

**Button + `render` prop**: Base UI's `Button` defaults `nativeButton` to
`true`. `src/components/ui/button.tsx` overrides this to default to `false`
whenever a `render` prop is supplied (e.g. `render={<Link href="..." />}`),
since a custom render target is rarely a literal `<button>`. Don't pass
`nativeButton` manually unless overriding this default for a specific
reason.

**Primary list-page CTAs** ("New profile", "New invoice", "Add agent", "Add
account") are styled consistently: `size="lg" className="rounded-full px-4"`
(some also add `shadow-sm`). Keep new list-page create-buttons matching this.

**No em dashes (—) in user-visible text.** This applies to page copy, labels,
button text, toast messages, `CardDescription`s, `AuditLog.summary` strings —
anything a user reads in the running app or a generated PDF. Use a period,
comma, colon, parentheses, or a middle dot (`·`, already used for metadata
lines like `name · date`) instead, whichever reads most naturally for that
sentence. For a placeholder shown when a table/detail field is empty (e.g. an
unset Age or Nationality), use a plain en dash (`–`) styled with
`text-muted-foreground`, not an em dash. Em dashes remain fine in code
comments (`//`, `{/* */}`) — those are never user-facing.

## Local dev

- `npm run dev` — Turbopack dev server, default port 3000 (falls back to
  3001 if already running; check before starting a second instance).
- `npm run db:seed` — seeds `admin@topway.lk` / `TopwayAdmin2026!` (OWNER)
  and a demo agent `demoagency` / `AgentDemo2026!`. The live dev database in
  this environment has real migrated legacy data instead of seed data in
  practice — check who's actually in it before assuming seed credentials
  work.
- No chart/graph library is installed. Visualizations (e.g. the dashboard's
  pipeline-breakdown bar) are built from plain `<div>`s with percentage
  widths, not a charting dependency — keep it that way unless a real need
  for a chart library arises.
