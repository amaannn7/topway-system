import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { AgentApplicantView } from "@/lib/agent-applicant-view";

// Server-rendered CV PDF with real, selectable text — replacing the legacy
// html2canvas + jsPDF screenshot approach (Phase 1: no selectable text,
// large files, fragile to font-load races). Layout mirrors the legacy's
// information architecture (skills / role+contract / headshot up top;
// personal+passport+education next to the full photo; employment +
// language table; footer) without copying its exact visual design.
//
// Uses Helvetica, one of react-pdf's built-in standard PDF fonts — no font
// file to bundle or register. The web app UI uses Inter everywhere; this
// is a reasonable trade-off for a printed/shared document rather than a
// brand-critical on-screen surface.

const INK = "#223138";
const MUTED = "#5c7278";
const ACCENT = "#2b4a54";
const ACCENT_LIGHT = "#eaf4f2";
const LINE = "#dce8ec";

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9.5, color: INK, padding: 0 },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderBottom: `3px solid ${ACCENT}`,
  },
  logo: { height: 40, maxWidth: 140, objectFit: "contain" },
  headerCenter: { alignItems: "center" },
  headerTitle: { fontSize: 13, fontWeight: 700, color: ACCENT, letterSpacing: 1 },
  headerSub: { fontSize: 7, color: MUTED, marginTop: 2, letterSpacing: 0.5 },
  body: { padding: 14, display: "flex", flexDirection: "column", gap: 8 },
  topgrid: { flexDirection: "row", gap: 8 },
  box: { border: `1px solid ${LINE}`, borderRadius: 3, flex: 1 },
  boxTitle: {
    backgroundColor: ACCENT,
    color: "#fff",
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 1,
    padding: "4 8",
  },
  skillRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: "4 8",
    borderTop: `1px solid ${LINE}`,
    fontSize: 8.5,
  },
  roleBox: {
    flex: 1,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    gap: 6,
  },
  roleTitle: { color: "#fff", fontSize: 14, fontWeight: 700, letterSpacing: 1 },
  contractPill: {
    backgroundColor: "#fff",
    color: ACCENT,
    fontSize: 7.5,
    fontWeight: 700,
    padding: "3 10",
    borderRadius: 20,
  },
  headshotBox: { width: 90, alignItems: "center", justifyContent: "center", padding: 6 },
  headshot: { width: "100%", height: 120, objectFit: "cover", borderRadius: 3 },
  maingrid: { flexDirection: "row", gap: 8 },
  infoRow: {
    flexDirection: "row",
    padding: "4 8",
    borderTop: `1px solid ${LINE}`,
    fontSize: 8.5,
  },
  infoRowEven: { backgroundColor: ACCENT_LIGHT },
  infoLbl: { width: "45%", fontWeight: 700 },
  infoVal: { flex: 1 },
  fullphotoBox: { width: 130, border: `1px solid ${LINE}`, borderRadius: 3 },
  fullphoto: { width: "100%", height: 200, objectFit: "cover" },
  refUnder: { backgroundColor: ACCENT, padding: "6 8", alignItems: "center" },
  refNo: { color: "rgba(255,255,255,0.7)", fontSize: 6.5, letterSpacing: 0.5 },
  refName: { color: "#fff", fontSize: 9, fontWeight: 700 },
  tableSection: {
    backgroundColor: ACCENT,
    color: "#fff",
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 1,
    padding: "4 8",
  },
  langTable: { border: `1px solid ${LINE}`, borderRadius: 3 },
  langHeaderRow: { flexDirection: "row", backgroundColor: ACCENT_LIGHT, fontSize: 7, fontWeight: 700, color: ACCENT },
  langHeaderCell: { flex: 1, padding: "4 8" },
  langRow: { flexDirection: "row", borderTop: `1px solid ${LINE}`, fontSize: 8.5 },
  langCell: { flex: 1, padding: "4 8" },
  empTable: { border: `1px solid ${LINE}`, borderRadius: 3, marginTop: 6 },
  empHeaderRow: { flexDirection: "row", backgroundColor: ACCENT_LIGHT, fontSize: 7, fontWeight: 700, color: ACCENT },
  empHeaderCell: { flex: 1, padding: "4 8" },
  empRow: { flexDirection: "row", borderTop: `1px solid ${LINE}`, fontSize: 8.5 },
  empCell: { flex: 1, padding: "4 8" },
  footer: {
    backgroundColor: ACCENT,
    color: "#fff",
    textAlign: "center",
    padding: 10,
    fontSize: 8.5,
    marginTop: "auto",
  },
});

function fmtDate(d: Date | null) {
  if (!d) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

const SKILLS: [keyof AgentApplicantView, string][] = [
  ["skillCleaning", "Cleaning"],
  ["skillWashing", "Washing"],
  ["skillBabysitting", "Baby Sitting"],
  ["skillCooking", "Arabic Cooking"],
  ["skillDriving", "Driving"],
];

// Confirmed passport/alteration-page documents are appended as extra PDF
// pages once the candidate is marked confirmed (Phase 1 §7 rule 5, legacy
// agent.html downloadCV()). Only image documents (jpeg/png) can be
// embedded this way — react-pdf's <Image> renders raster images, not
// arbitrary PDFs; a document uploaded as a PDF is skipped here and stays
// downloadable on its own from the applicant detail page instead.
const imagePageStyles = StyleSheet.create({
  page: { padding: 0 },
  image: { width: "100%", height: "100%", objectFit: "contain" },
});

export function CvDocument({
  applicant,
  agencyLogoUrl,
  agencyName,
  footerLines,
  extraImagePages = [],
}: {
  applicant: AgentApplicantView;
  agencyLogoUrl: string | null;
  agencyName: string | null;
  footerLines: string[];
  extraImagePages?: string[];
}) {
  const personalRows: [string, string][] = [
    ["Nationality", applicant.nationality ?? ""],
    ["Religion", applicant.religion ?? ""],
    ["D.O.B", fmtDate(applicant.dateOfBirth)],
    ["Age", applicant.age?.toString() ?? ""],
    ["Height", applicant.heightCm ? `${applicant.heightCm} cm` : ""],
    ["Weight", applicant.weightKg ? `${applicant.weightKg} kg` : ""],
    ["Marital status", applicant.maritalStatus ?? ""],
    ["Children (no.)", applicant.children?.toString() ?? ""],
  ];
  const passportRows: [string, string][] = [
    ["Passport no.", applicant.passportNo ?? ""],
    ["Date of issue", fmtDate(applicant.passportIssueDate)],
    ["Date of expiry", fmtDate(applicant.passportExpiryDate)],
    ["Place of issue", applicant.passportIssuedAt ?? ""],
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topbar}>
          {agencyLogoUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt prop
            <Image src={agencyLogoUrl} style={styles.logo} />
          ) : (
            <Text style={{ fontSize: 7, color: MUTED }}>{agencyName ?? ""}</Text>
          )}
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>CANDIDATE PROFILE</Text>
            <Text style={styles.headerSub}>Applicant Information Sheet</Text>
          </View>
          <View style={{ width: 140 }} />
        </View>

        <View style={styles.body}>
          <View style={styles.topgrid}>
            <View style={styles.box}>
              <Text style={styles.boxTitle}>Skills</Text>
              {SKILLS.map(([key, label]) => (
                <View key={label} style={styles.skillRow}>
                  <Text>{label}</Text>
                  <Text>{applicant[key] ? "✓" : ""}</Text>
                </View>
              ))}
            </View>
            <View style={styles.roleBox}>
              <Text style={styles.roleTitle}>{applicant.role.toUpperCase()}</Text>
              <Text style={styles.contractPill}>Contract: {applicant.contract}</Text>
            </View>
            <View style={styles.headshotBox}>
              {applicant.headshotUrl ? (
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image src={applicant.headshotUrl} style={styles.headshot} />
              ) : (
                <Text style={{ fontSize: 7, color: MUTED }}>No headshot</Text>
              )}
            </View>
          </View>

          <View style={styles.maingrid}>
            <View style={[styles.box, { flex: 1 }]}>
              {personalRows.map(([label, value], i) => (
                <View
                  key={label}
                  style={i % 2 === 1 ? [styles.infoRow, styles.infoRowEven] : styles.infoRow}
                >
                  <Text style={styles.infoLbl}>{label}</Text>
                  <Text style={styles.infoVal}>{value}</Text>
                </View>
              ))}
              {passportRows.map(([label, value], i) => (
                <View
                  key={label}
                  style={i % 2 === 1 ? [styles.infoRow, styles.infoRowEven] : styles.infoRow}
                >
                  <Text style={styles.infoLbl}>{label}</Text>
                  <Text style={styles.infoVal}>{value}</Text>
                </View>
              ))}
              <Text style={styles.tableSection}>EDUCATIONAL QUALIFICATION</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLbl}>Grade</Text>
                <Text style={styles.infoVal}>{applicant.educationLevel ?? ""}</Text>
              </View>
              <View style={[styles.infoRow, styles.infoRowEven]}>
                <Text style={styles.infoLbl}>Year</Text>
                <Text style={styles.infoVal}>{applicant.educationYear ?? ""}</Text>
              </View>
            </View>

            <View style={styles.fullphotoBox}>
              {applicant.fullPhotoUrl ? (
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image src={applicant.fullPhotoUrl} style={styles.fullphoto} />
              ) : (
                <View style={{ height: 200, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 7, color: MUTED }}>No photo</Text>
                </View>
              )}
              <View style={styles.refUnder}>
                <Text style={styles.refName}>{applicant.name}</Text>
              </View>
            </View>
          </View>

          <View>
            <Text style={styles.tableSection}>Language Skills</Text>
            <View style={styles.langTable}>
              <View style={styles.langHeaderRow}>
                <Text style={styles.langHeaderCell}>Language</Text>
                <Text style={styles.langHeaderCell}>Speaking</Text>
                <Text style={styles.langHeaderCell}>Writing</Text>
              </View>
              <View style={styles.langRow}>
                <Text style={styles.langCell}>English</Text>
                <Text style={styles.langCell}>{applicant.englishSpeaking ? "✓" : ""}</Text>
                <Text style={styles.langCell}>{applicant.englishWriting ? "✓" : ""}</Text>
              </View>
              <View style={styles.langRow}>
                <Text style={styles.langCell}>Arabic</Text>
                <Text style={styles.langCell}>{applicant.arabicSpeaking ? "✓" : ""}</Text>
                <Text style={styles.langCell}>{applicant.arabicWriting ? "✓" : ""}</Text>
              </View>
            </View>

            {applicant.employmentHistory.length > 0 && (
              <View style={styles.empTable}>
                <View style={styles.empHeaderRow}>
                  <Text style={styles.empHeaderCell}>Position</Text>
                  <Text style={styles.empHeaderCell}>Country</Text>
                  <Text style={styles.empHeaderCell}>Period</Text>
                </View>
                {applicant.employmentHistory.map((row) => (
                  <View key={row.id} style={styles.empRow}>
                    <Text style={styles.empCell}>{row.position}</Text>
                    <Text style={styles.empCell}>{row.country}</Text>
                    <Text style={styles.empCell}>{row.period}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {footerLines.length > 0 && (
          <View style={styles.footer}>
            {footerLines.map((line) => (
              <Text key={line}>{line}</Text>
            ))}
          </View>
        )}
      </Page>

      {extraImagePages.map((src) => (
        <Page key={src} size="A4" style={imagePageStyles.page}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={src} style={imagePageStyles.image} />
        </Page>
      ))}
    </Document>
  );
}
