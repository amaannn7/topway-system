// One-time data migration: imports the real legacy portal.topway.lk data
// (data/profiles.json, data/agents.json, data/invoices.json + uploaded
// files) into the new Postgres schema. Read-only against the legacy
// source — never writes back to it. Idempotent-ish: re-running wipes and
// re-imports (see WIPE_EXISTING) rather than trying to diff/upsert, since
// this is a one-shot historical import, not an ongoing sync.
//
// Field mapping notes (see prisma/schema.prisma for the target shape):
//   - profiles.json "fields" (f-role, f-dob, ...) -> Applicant columns
//   - profiles.json "tracking" (medical/medical_date, ...) -> PipelineStep
//     rows, one per fixed step key, in the legacy's exact order
//   - profiles.json "images" -> ApplicantPhoto (headshot/fullphoto) +
//     ApplicantDocument (doc-passport/doc-alteration)
//   - the "__global__" fake profile record -> OrgSettings.headerLogoUrl
//   - agents.json bcrypt hashes ($2y$...) are reused as-is — bcryptjs
//     verifies $2y$ hashes identically to PHP's password_hash/password_verify,
//     so agents and the admin keep their existing passwords, no reset needed
//   - agents.json applicantIds/pendingIds -> AgentAssignment/AgentRequest
//   - invoices.json workers/billTo/bankDetails/companyFooter -> flattened
//     onto Invoice + InvoiceWorker rows
//
// Known legacy data quirks handled explicitly (found by inspecting the
// full files before writing this, not assumed):
//   - f-height/f-weight are free-text ("155 CM", "158CM", "155") -> parsed
//     with a regex that extracts the leading integer; anything unparsable
//     is logged and left null rather than crashing the import
//   - one applicant (mq531f6qfa7f63) references two image files that no
//     longer exist on disk -> skipped with a warning, rest of the record
//     still imports
//   - invoice "19" is duplicated (two distinct real invoices, 7 seconds
//     apart) -> both imported; the second gets invoiceNo "19-2" since the
//     new schema enforces uniqueness the legacy never did

import { readFileSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const LEGACY_ROOT = "C:/Users/USER/Downloads/portal.topway.lk/portal.topway.lk";
const LEGACY_DATA = path.join(LEGACY_ROOT, "data");
const LEGACY_UPLOADS = path.join(LEGACY_ROOT, "uploads");
const NEW_UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");

const WIPE_EXISTING = true;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const warnings = [];
function warn(msg) {
  warnings.push(msg);
  console.warn("  WARN:", msg);
}

// ── helpers ──────────────────────────────────────────────────────────

function toDate(v) {
  if (!v) return null;
  const d = new Date(`${v}T00:00:00.000Z`);
  return isNaN(d.getTime()) ? null : d;
}

function toInt(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

// Legacy height/weight are free text ("155 CM", "158CM", "155", "60 KG").
// Extract the leading integer; anything with no leading digits logs a
// warning and returns null instead of silently losing data with no trace.
function parseNumericPrefix(v, context) {
  if (!v) return null;
  const m = String(v).match(/(\d+)/);
  if (!m) {
    warn(`Could not parse numeric value from "${v}" (${context})`);
    return null;
  }
  return parseInt(m[1], 10);
}

const MARITAL_MAP = {
  Single: "SINGLE",
  Married: "MARRIED",
  Divorced: "DIVORCED",
  Widowed: "WIDOWED",
};

function mapMarital(v) {
  return MARITAL_MAP[v] ?? null;
}

// Legacy stores these as its own lowercase-with-underscore strings
// (admin.html: 'available_exp' | 'available_new' | 'contracted').
const WORKER_CATEGORY_MAP = {
  available_exp: "AVAILABLE_EXPERIENCED",
  available_new: "AVAILABLE_INEXPERIENCED",
  contracted: "CONTRACTED",
};

function mapWorkerCategory(v, context) {
  if (!v) return null;
  const mapped = WORKER_CATEGORY_MAP[v];
  if (!mapped) {
    warn(`Unknown workerCategory "${v}" (${context}) — left null`);
    return null;
  }
  return mapped;
}

// Legacy EXP_OPTIONS are display strings ('HM 21-49 Exp', 'HM - First Time',
// 'Couple', 'Driver', 'House Boy', ...) — map explicitly rather than
// guessing via string transforms, since 'HM - First Time' doesn't
// round-trip through a simple uppercase+underscore transform.
const EXPERIENCE_MAP = {
  "HM 21-49 Exp": "HM_21_49_EXP",
  "HM 50-55 Exp": "HM_50_55_EXP",
  "HM 51-55 Exp": "HM_51_55_EXP",
  "HM - First Time": "HM_FIRST_TIME",
  Couple: "COUPLE",
  Driver: "DRIVER",
  "House Boy": "HOUSE_BOY",
};

function mapExperience(v, context) {
  if (!v) return null;
  const mapped = EXPERIENCE_MAP[v];
  if (!mapped) {
    warn(`Unknown experience "${v}" (${context}) — left null`);
    return null;
  }
  return mapped;
}

const PIPELINE_KEYS = ["medical", "enjaz", "bureau", "wakalah", "embassy", "payment"];
const PIPELINE_KEY_TO_ENUM = {
  medical: "MEDICAL",
  enjaz: "ENJAZ",
  bureau: "BUREAU",
  wakalah: "WAKALAH",
  embassy: "EMBASSY",
  payment: "PAYMENT",
};

function ensureUploadDir(subdir) {
  const dir = path.join(NEW_UPLOADS_ROOT, subdir);
  mkdirSync(dir, { recursive: true });
  return dir;
}

// Copies a legacy upload file into public/uploads/<subdir>/<filename> if
// the source actually exists; returns the new app-relative URL, or null
// (with a warning) if the source file is missing on disk.
function copyLegacyFile(filename, subdir, context) {
  if (!filename) return null;
  const src = path.join(LEGACY_UPLOADS, filename);
  if (!existsSync(src)) {
    warn(`Missing file on disk, skipping: ${filename} (${context})`);
    return null;
  }
  const destDir = ensureUploadDir(subdir);
  const destPath = path.join(destDir, filename);
  copyFileSync(src, destPath);
  return `/uploads/${subdir}/${filename}`;
}

function mimeForFile(filename) {
  const ext = filename.toLowerCase().split(".").pop();
  if (ext === "pdf") return "application/pdf";
  if (ext === "png") return "image/png";
  return "image/jpeg";
}

// ── main ─────────────────────────────────────────────────────────────

async function main() {
  console.log("Reading legacy data files...");
  const profilesData = JSON.parse(readFileSync(path.join(LEGACY_DATA, "profiles.json"), "utf-8"));
  const agentsData = JSON.parse(readFileSync(path.join(LEGACY_DATA, "agents.json"), "utf-8"));
  const invoicesData = JSON.parse(readFileSync(path.join(LEGACY_DATA, "invoices.json"), "utf-8"));

  const globalRecord = profilesData.profiles.find((r) => r.id === "__global__");
  const applicantRecords = profilesData.profiles.filter((r) => r.id !== "__global__");

  console.log(`Found ${applicantRecords.length} applicants, ${agentsData.agents.length} agents, ${invoicesData.invoices.length} invoices.`);

  if (WIPE_EXISTING) {
    console.log("\nClearing existing migrated data (applicants, agents, invoices)...");
    // Deleting Applicant/Agent/Invoice cascades to their child rows
    // (pipeline steps, photos, documents, employment history, assignments,
    // requests, invoice workers) per the schema's onDelete: Cascade.
    await prisma.invoice.deleteMany({});
    await prisma.agent.deleteMany({});
    await prisma.applicant.deleteMany({});
  }

  // ── Admin password: reuse the legacy shared admin password hash for
  // the existing seeded OWNER account, so "the real system's password"
  // keeps working rather than forcing everyone back to the dev seed
  // password. bcryptjs verifies $2y$ hashes exactly like PHP does.
  console.log("\nUpdating admin password to match legacy...");
  const seededAdmin = await prisma.adminUser.findFirst({ where: { role: "OWNER" } });
  if (seededAdmin && agentsData.adminPasswordHash) {
    await prisma.adminUser.update({
      where: { id: seededAdmin.id },
      data: { passwordHash: agentsData.adminPasswordHash },
    });
    console.log(`  Updated ${seededAdmin.email} to use the legacy admin password.`);
  } else {
    warn("No seeded OWNER admin found, or legacy adminPasswordHash missing — skipped.");
  }

  // ── Org settings: shared logo from the __global__ record, plus browse
  // toggle from agents.json settings.
  console.log("\nMigrating org settings (shared logo, browse toggle)...");
  const globalLogoFile = globalRecord?.images?.foreignLogo ?? null;
  const globalLogoUrl = copyLegacyFile(globalLogoFile, "org", "global header logo");
  await prisma.orgSettings.upsert({
    where: { id: "singleton" },
    update: {
      headerLogoUrl: globalLogoUrl ?? undefined,
      allowAgentBrowse: !!agentsData.settings?.allowAgentBrowse,
    },
    create: {
      id: "singleton",
      headerLogoUrl: globalLogoUrl,
      allowAgentBrowse: !!agentsData.settings?.allowAgentBrowse,
    },
  });

  // ── Agents ──────────────────────────────────────────────────────────
  console.log("\nMigrating agents...");
  const agentIdMap = new Map(); // legacy id -> new cuid
  for (const ag of agentsData.agents) {
    const logoUrl = copyLegacyFile(ag.logo, `agents/${ag.id}`, `agent logo for ${ag.id}`);
    const created = await prisma.agent.create({
      data: {
        name: ag.name,
        company: ag.company,
        country: ag.country,
        username: ag.username.toLowerCase(),
        // Legacy bcrypt hash reused as-is — same algorithm as bcryptjs.
        passwordHash: ag.passwordHash,
        active: ag.active !== false,
        logoUrl,
        createdAt: new Date(ag.createdAt || Date.now()),
      },
    });
    agentIdMap.set(ag.id, created.id);
    console.log(`  ${ag.company} (@${ag.username}) -> ${created.id}`);
  }

  // ── Applicants ──────────────────────────────────────────────────────
  console.log("\nMigrating applicants...");
  const applicantIdMap = new Map(); // legacy id -> new cuid
  let migratedCount = 0;

  for (const rec of applicantRecords) {
    const f = rec.fields || {};
    const im = rec.images || {};
    const tr = rec.tracking || {};

    const applicant = await prisma.applicant.create({
      data: {
        refNo: f["f-refno"] || null,
        name: f["f-name"] || "(Unnamed)",
        role: f["f-role"] || "HOUSEMAID",
        contract: f["f-contract"] || "2 YEARS",
        nationality: f["f-nationality"] || null,
        religion: f["f-religion"] || null,
        dateOfBirth: toDate(f["f-dob"]),
        age: toInt(f["f-age"]),
        heightCm: parseNumericPrefix(f["f-height"], `height for ${rec.id}`),
        weightKg: parseNumericPrefix(f["f-weight"], `weight for ${rec.id}`),
        maritalStatus: mapMarital(f["f-marital"]),
        children: toInt(f["f-children"]),
        passportNo: f["f-passport"] || null,
        passportIssuedAt: f["f-pissue"] || null,
        passportIssueDate: toDate(f["f-doi"]),
        passportExpiryDate: toDate(f["f-doe"]),
        educationLevel: f["f-edu"] || null,
        educationYear: toInt(f["f-eduyear"]),
        skillCleaning: !!f["sk-cleaning"],
        skillWashing: !!f["sk-washing"],
        skillBabysitting: !!f["sk-babysitting"],
        skillCooking: !!f["sk-cooking"],
        skillDriving: !!f["sk-driving"],
        englishSpeaking: !!f["lang-en-speak"],
        englishWriting: !!f["lang-en-write"],
        arabicSpeaking: !!f["lang-ar-speak"],
        arabicWriting: !!f["lang-ar-write"],
        footerLine1: f["footer-1"] || null,
        footerLine2: f["footer-2"] || null,
        footerLine3: f["footer-3"] || null,
        phone: f["f-phone"] || null,
        whatsapp: f["f-whatsapp"] || null,
        email: f["f-email"] || null,
        emergencyContact: f["f-emergency"] || null,
        address: f["f-address"] || null,

        pipelineStatus: tr.pipelineStatus === "sent" ? "SENT" : "ACTIVE",
        workerCategory: mapWorkerCategory(tr.workerCategory, `applicant ${rec.id}`),
        experienceType: mapExperience(tr.experience, `applicant ${rec.id}`),
        confirmed: !!tr.confirmed,
        musanedDate: toDate(tr.musaned),
        ticketDate: toDate(tr.ticketDate),
        saudiAgentVisaDate: toDate(tr.saudiAgentDate),
        notes: tr.notes || null,
        createdAt: rec.savedAt ? new Date(rec.savedAt) : new Date(),

        employmentHistory: {
          create: (f.empRows || []).map((row, i) => ({
            position: row.position || "",
            country: row.country || "",
            period: row.period || "",
            sortOrder: i,
          })),
        },
        pipelineSteps: {
          create: PIPELINE_KEYS.map((key, i) => ({
            key: PIPELINE_KEY_TO_ENUM[key],
            sortOrder: i,
            completed: !!tr[key],
            completedAt: tr[key] ? toDate(tr[`${key}_date`]) : null,
          })),
        },
      },
    });
    applicantIdMap.set(rec.id, applicant.id);

    // Photos
    const headshotUrl = copyLegacyFile(im.headshot, `applicants/${applicant.id}`, `headshot for ${rec.id}`);
    if (headshotUrl) {
      await prisma.applicantPhoto.create({
        data: { applicantId: applicant.id, kind: "HEADSHOT", url: headshotUrl },
      });
    }
    const fullPhotoUrl = copyLegacyFile(im.fullphoto, `applicants/${applicant.id}`, `full photo for ${rec.id}`);
    if (fullPhotoUrl) {
      await prisma.applicantPhoto.create({
        data: { applicantId: applicant.id, kind: "FULL_BODY", url: fullPhotoUrl },
      });
    }

    // Documents
    const passportUrl = copyLegacyFile(im["doc-passport"], `applicants/${applicant.id}`, `passport doc for ${rec.id}`);
    if (passportUrl) {
      await prisma.applicantDocument.create({
        data: {
          applicantId: applicant.id,
          kind: "PASSPORT",
          url: passportUrl,
          mimeType: mimeForFile(im["doc-passport"]),
        },
      });
    }
    const alterationUrl = copyLegacyFile(im["doc-alteration"], `applicants/${applicant.id}`, `alteration doc for ${rec.id}`);
    if (alterationUrl) {
      await prisma.applicantDocument.create({
        data: {
          applicantId: applicant.id,
          kind: "ALTERATION_PAGE",
          url: alterationUrl,
          mimeType: mimeForFile(im["doc-alteration"]),
        },
      });
    }

    migratedCount++;
  }
  console.log(`  Migrated ${migratedCount} applicants.`);

  // ── Agent assignments + requests ──────────────────────────────────
  console.log("\nMigrating agent assignments and pending requests...");
  let assignmentCount = 0;
  let requestCount = 0;
  let danglingRefs = 0;
  for (const ag of agentsData.agents) {
    const newAgentId = agentIdMap.get(ag.id);
    for (const legacyApplicantId of ag.applicantIds || []) {
      const newApplicantId = applicantIdMap.get(legacyApplicantId);
      if (!newApplicantId) {
        warn(`Agent ${ag.id} references unknown applicant ${legacyApplicantId} — skipped`);
        danglingRefs++;
        continue;
      }
      await prisma.agentAssignment.create({
        data: { agentId: newAgentId, applicantId: newApplicantId },
      });
      assignmentCount++;
    }
    for (const legacyApplicantId of ag.pendingIds || []) {
      const newApplicantId = applicantIdMap.get(legacyApplicantId);
      if (!newApplicantId) {
        warn(`Agent ${ag.id} has pending request for unknown applicant ${legacyApplicantId} — skipped`);
        danglingRefs++;
        continue;
      }
      await prisma.agentRequest.create({
        data: { agentId: newAgentId, applicantId: newApplicantId, status: "PENDING" },
      });
      requestCount++;
    }
  }
  console.log(`  Created ${assignmentCount} assignments, ${requestCount} pending requests (${danglingRefs} dangling refs skipped).`);

  // ── Invoices ────────────────────────────────────────────────────────
  console.log("\nMigrating invoices...");
  const seenInvoiceNos = new Map(); // invoiceNo -> count, for de-duplication
  let invoiceCount = 0;
  for (const inv of invoicesData.invoices) {
    let invoiceNo = String(inv.invoiceNo ?? "").trim() || `unnumbered-${inv.id}`;
    const priorCount = seenInvoiceNos.get(invoiceNo) ?? 0;
    if (priorCount > 0) {
      const disambiguated = `${invoiceNo}-${priorCount + 1}`;
      warn(`Duplicate invoiceNo "${invoiceNo}" (legacy id ${inv.id}) — renumbered to "${disambiguated}"`);
      invoiceNo = disambiguated;
    }
    seenInvoiceNos.set(String(inv.invoiceNo ?? "").trim() || `unnumbered-${inv.id}`, priorCount + 1);

    const advance = inv.advance || (inv.advanceRequest?.enabled ? { status: "paid", amount: inv.advanceRequest.amount } : { status: "none", amount: 0 });
    const footer = inv.companyFooter || {};
    const bank = inv.bankDetails || {};

    // Bill-to agent link: match by company name back to a migrated agent,
    // best-effort only (legacy never stored a real FK here either).
    const matchedAgent = agentsData.agents.find(
      (a) => a.company.trim().toUpperCase() === (inv.billTo?.company || "").trim().toUpperCase()
    );

    const totalNumeric = Number(String(inv.total ?? "0").replace(/,/g, "")) || 0;

    const created = await prisma.invoice.create({
      data: {
        invoiceNo,
        invoicedDate: toDate(inv.invoicedDate) ?? new Date(inv.createdAt || Date.now()),
        currency: inv.currency || "KD",
        agentId: matchedAgent ? agentIdMap.get(matchedAgent.id) : null,
        billToTitle: inv.billTo?.title || "MR.",
        billToCompany: inv.billTo?.company || "",
        billToPurpose: inv.billTo?.purpose || "For Recruitment of Domestic Manpower",
        billToLicenseNo: inv.billTo?.licenseNo || null,
        serviceType: inv.serviceType || "HOUSEMAID WORKERS",
        advanceStatus: (advance.status || "none").toUpperCase(),
        advanceAmount: Number(advance.amount) || 0,
        total: totalNumeric,
        paymentMethod: inv.paymentMethod || "REMITTANCE",
        bankName: bank.bankName || "",
        accountNo: bank.accountNo || "",
        accountName: bank.accountName || "",
        swiftCode: bank.swiftCode || "",
        notes: inv.notes || null,
        footerEmail: footer.email || "info@topway.lk",
        footerPhone: footer.phone || "",
        footerFax: footer.fax || "",
        footerAddress: footer.address || "",
        footerWebsite: footer.website || "",
        createdAt: inv.createdAt ? new Date(inv.createdAt) : new Date(),
        updatedAt: inv.updatedAt ? new Date(inv.updatedAt) : new Date(),
        workers: {
          create: (inv.workers || []).map((w, i) => ({
            name: w.name || "",
            qty: toInt(w.qty) || 1,
            amount: Number(w.amount) || 0,
            sortOrder: i,
          })),
        },
      },
    });
    invoiceCount++;
    void created;
  }
  console.log(`  Migrated ${invoiceCount} invoices.`);

  // ── Summary ──────────────────────────────────────────────────────────
  const [applicantTotal, agentTotal, invoiceTotal, photoTotal, docTotal] = await Promise.all([
    prisma.applicant.count(),
    prisma.agent.count(),
    prisma.invoice.count(),
    prisma.applicantPhoto.count(),
    prisma.applicantDocument.count(),
  ]);

  console.log("\n=== Migration complete ===");
  console.log(`Applicants: ${applicantTotal}`);
  console.log(`Agents: ${agentTotal}`);
  console.log(`Invoices: ${invoiceTotal}`);
  console.log(`Photos migrated: ${photoTotal}`);
  console.log(`Documents migrated: ${docTotal}`);
  console.log(`Warnings: ${warnings.length}`);
  if (warnings.length) {
    console.log("\nAll warnings:");
    warnings.forEach((w) => console.log("  -", w));
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Migration failed:", e);
  await prisma.$disconnect();
  process.exit(1);
});
