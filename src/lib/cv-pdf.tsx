import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Svg,
  Defs,
  LinearGradient,
  Stop,
  Rect,
} from "@react-pdf/renderer";
import type { AgentApplicantView } from "@/lib/agent-applicant-view";

// react-pdf's <Image> can't reliably load a local file by path/URL on
// Windows (see lib/pdf-assets.ts) — callers read the file themselves and
// hand over raw bytes instead, so every local-image prop here takes a
// Buffer rather than the string URL these fields hold elsewhere in the app.
type PdfImageSrc = Buffer | null;
type CvApplicant = Omit<AgentApplicantView, "headshotUrl" | "fullPhotoUrl"> & {
  headshotUrl: PdfImageSrc;
  fullPhotoUrl: PdfImageSrc;
};

// Server-rendered CV PDF with real, selectable text — replacing the legacy
// html2canvas + jsPDF screenshot approach (Phase 1: no selectable text,
// large files, fragile to font-load races). Layout AND colors now mirror
// the legacy #pdf-layout template pixel-for-pixel (index.html / agent.html
// / style.css's #pdf-layout block): same --pdf-* palette, same topbar with
// agency logo left / title center / Topway logo right, same gradient role
// box, same "Ref No. {ref}" line above the candidate name under the full
// photo.
//
// Uses Helvetica, one of react-pdf's built-in standard PDF fonts — no font
// file to bundle or register. The web app UI uses Inter everywhere; this
// is a reasonable trade-off for a printed/shared document rather than a
// brand-critical on-screen surface.

const INK = "#1a2830";
const MUTED = "#5d7d8c";
const LINE = "#dce8ec";
const LINE_STRONG = "#b5cdd6";
const ACCENT = "#284e5a";
const ACCENT_2 = "#3a6e7e";
const ACCENT_LIGHT = "#eaf4f7";

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9.5, color: INK, padding: 0 },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderBottom: `3px solid ${ACCENT}`,
  },
  logoSlot: { width: 140, justifyContent: "center" },
  logoSlotRight: { width: 140, alignItems: "flex-end" },
  logo: { height: 40, maxWidth: 140, objectFit: "contain" },
  headerCenter: { alignItems: "center" },
  headerTitle: { fontSize: 13, fontWeight: 700, color: ACCENT, letterSpacing: 1 },
  headerSub: { fontSize: 7, color: MUTED, marginTop: 2, letterSpacing: 0.5 },
  body: { padding: 14, display: "flex", flexDirection: "column", gap: 8 },
  topgrid: { flexDirection: "row", gap: 8 },
  box: { border: `1px solid ${LINE_STRONG}`, borderRadius: 3, flex: 1 },
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
    alignItems: "center",
    justifyContent: "space-between",
    padding: "4 8",
    borderTop: `1px solid ${LINE}`,
    fontSize: 8.5,
  },
  checkbox: {
    width: 12,
    height: 12,
    border: `1.2px solid ${LINE_STRONG}`,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxMark: { fontSize: 7.5, color: ACCENT },
  roleBox: {
    flex: 1,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    gap: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  roleBoxFill: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
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
  fullphotoBox: { width: 130, border: `1px solid ${LINE_STRONG}`, borderRadius: 3 },
  fullphoto: { width: "100%", height: 200, objectFit: "cover" },
  refUnder: { backgroundColor: ACCENT, padding: "6 8", alignItems: "center" },
  refNo: { color: "rgba(255,255,255,0.7)", fontSize: 6.5, letterSpacing: 0.5 },
  refName: { color: "#fff", fontSize: 9, fontWeight: 700, marginTop: 2 },
  tableSection: {
    backgroundColor: ACCENT,
    color: "#fff",
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 1,
    padding: "4 8",
  },
  empBlock: { border: `1px solid ${LINE_STRONG}`, borderRadius: 3 },
  empBlockTitle: {
    backgroundColor: ACCENT,
    color: "#fff",
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 1,
    padding: "4 8",
  },
  langHeaderRow: { flexDirection: "row", backgroundColor: ACCENT_LIGHT, fontSize: 7, fontWeight: 700, color: ACCENT },
  langHeaderCell: { flex: 1, padding: "4 8" },
  langHeaderCellCenter: { width: 78, padding: "4 8", textAlign: "center" },
  langRow: { flexDirection: "row", alignItems: "center", borderTop: `1px solid ${LINE}`, fontSize: 8.5 },
  langCell: { flex: 1, padding: "4 8" },
  langCellCenter: { width: 78, padding: "4 8", alignItems: "center" },
  empHeaderRow: { flexDirection: "row", backgroundColor: ACCENT_LIGHT, fontSize: 7, fontWeight: 700, color: ACCENT, borderTop: `1px solid ${LINE_STRONG}` },
  empHeaderCell: { flex: 1, padding: "4 8" },
  empRow: { flexDirection: "row", borderTop: `1px solid ${LINE}`, fontSize: 8.5 },
  empRowEven: { backgroundColor: ACCENT_LIGHT },
  empCell: { flex: 1, padding: "4 8" },
  empEmptyRow: { padding: "8 8", borderTop: `1px solid ${LINE}`, alignItems: "center" },
  empEmptyText: { fontSize: 8.5, color: MUTED },
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
  topwayLogoUrl,
  footerLines,
  extraImagePages = [],
}: {
  applicant: CvApplicant;
  agencyLogoUrl: PdfImageSrc;
  agencyName: string | null;
  topwayLogoUrl: PdfImageSrc;
  footerLines: string[];
  extraImagePages?: Buffer[];
}) {
  const personalRows: [string, string][] = [
    ["Nationality", applicant.nationality ?? ""],
    ["Religion", applicant.religion ?? ""],
    ["D.O.B", fmtDate(applicant.dateOfBirth)],
    ["Age", applicant.age?.toString() ?? ""],
    ["Height", applicant.heightCm ? `${applicant.heightCm} cm` : ""],
    ["Weight", applicant.weightKg ? `${applicant.weightKg} kg` : ""],
    ["Marital Status", applicant.maritalStatus ?? ""],
    ["Children (No.)", applicant.children?.toString() ?? ""],
  ];
  const passportRows: [string, string][] = [
    ["Passport No.", applicant.passportNo ?? ""],
    ["Date of Issue", fmtDate(applicant.passportIssueDate)],
    ["Date of Expiry", fmtDate(applicant.passportExpiryDate)],
    ["Place of Issue", applicant.passportIssuedAt ?? ""],
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topbar}>
          <View style={styles.logoSlot}>
            {agencyLogoUrl ? (
              // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt prop
              <Image src={agencyLogoUrl} style={styles.logo} />
            ) : (
              <Text style={{ fontSize: 7, color: MUTED }}>{agencyName ?? "Foreign agency logo"}</Text>
            )}
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>CANDIDATE PROFILE</Text>
            <Text style={styles.headerSub}>Applicant Information Sheet</Text>
          </View>
          <View style={styles.logoSlotRight}>
            {topwayLogoUrl && (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={topwayLogoUrl} style={styles.logo} />
            )}
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.topgrid}>
            <View style={styles.box}>
              <Text style={styles.boxTitle}>Skills</Text>
              {SKILLS.map(([key, label]) => (
                <View key={label} style={styles.skillRow}>
                  <Text>{label}</Text>
                  <View style={styles.checkbox}>
                    <Text style={styles.checkboxMark}>{applicant[key] ? "X" : ""}</Text>
                  </View>
                </View>
              ))}
            </View>
            <View style={styles.roleBox}>
              <Svg style={styles.roleBoxFill} viewBox="0 0 100 100">
                <Defs>
                  <LinearGradient id="roleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor={ACCENT} />
                    <Stop offset="100%" stopColor={ACCENT_2} />
                  </LinearGradient>
                </Defs>
                <Rect x={0} y={0} width={100} height={100} fill="url(#roleGradient)" />
              </Svg>
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
                <Text style={styles.infoLbl}>GRADE</Text>
                <Text style={styles.infoVal}>{applicant.educationLevel ?? ""}</Text>
              </View>
              <View style={[styles.infoRow, styles.infoRowEven]}>
                <Text style={styles.infoLbl}>YEAR</Text>
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
                <Text style={styles.refNo}>REF NO. {applicant.refNo ?? "–"}</Text>
                <Text style={styles.refName}>{applicant.name}</Text>
              </View>
            </View>
          </View>

          <View style={styles.empBlock}>
            <Text style={styles.empBlockTitle}>Employment Record &amp; Language Skills</Text>

            <View style={styles.langHeaderRow}>
              <Text style={styles.langHeaderCell}>Language</Text>
              <Text style={styles.langHeaderCellCenter}>Speaking</Text>
              <Text style={styles.langHeaderCellCenter}>Writing</Text>
            </View>
            <View style={styles.langRow}>
              <Text style={styles.langCell}>English</Text>
              <View style={styles.langCellCenter}>
                <View style={styles.checkbox}>
                  <Text style={styles.checkboxMark}>{applicant.englishSpeaking ? "X" : ""}</Text>
                </View>
              </View>
              <View style={styles.langCellCenter}>
                <View style={styles.checkbox}>
                  <Text style={styles.checkboxMark}>{applicant.englishWriting ? "X" : ""}</Text>
                </View>
              </View>
            </View>
            <View style={styles.langRow}>
              <Text style={styles.langCell}>Arabic</Text>
              <View style={styles.langCellCenter}>
                <View style={styles.checkbox}>
                  <Text style={styles.checkboxMark}>{applicant.arabicSpeaking ? "X" : ""}</Text>
                </View>
              </View>
              <View style={styles.langCellCenter}>
                <View style={styles.checkbox}>
                  <Text style={styles.checkboxMark}>{applicant.arabicWriting ? "X" : ""}</Text>
                </View>
              </View>
            </View>

            <View style={styles.empHeaderRow}>
              <Text style={styles.empHeaderCell}>Position</Text>
              <Text style={styles.empHeaderCell}>Country</Text>
              <Text style={styles.empHeaderCell}>Period</Text>
            </View>
            {applicant.employmentHistory.length > 0 ? (
              applicant.employmentHistory.map((row, i) => (
                <View key={row.id} style={i % 2 === 1 ? [styles.empRow, styles.empRowEven] : styles.empRow}>
                  <Text style={styles.empCell}>{row.position}</Text>
                  <Text style={styles.empCell}>{row.country}</Text>
                  <Text style={styles.empCell}>{row.period}</Text>
                </View>
              ))
            ) : (
              <View style={styles.empEmptyRow}>
                <Text style={styles.empEmptyText}>–</Text>
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

      {extraImagePages.map((src, i) => (
        <Page key={i} size="A4" style={imagePageStyles.page}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={src} style={imagePageStyles.image} />
        </Page>
      ))}
    </Document>
  );
}
