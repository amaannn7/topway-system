import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { Invoice, InvoiceWorker } from "@/generated/prisma/client";

// Server-rendered invoice PDF with real text — same rationale as the CV
// PDF (lib/cv-pdf.tsx): replaces the legacy's html2canvas + jsPDF
// screenshot. Layout mirrors the legacy invoice.html template (logo +
// bill-to header, date badge, title row, services table with a subtotal/
// advance breakdown, bank details + amount footer, thank-you note, contact
// footer) without copying its exact visual design.

const INK = "#2f2f2f";
const MUTED = "#777";
const ACCENT = "#274650";
const ACCENT_2 = "#2b7a8c";
const LINE = "#e8eef1";

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, color: INK, padding: "36 44" },
  headerRow: { flexDirection: "row", marginBottom: 10 },
  headerLeft: { width: "50%", paddingRight: 16 },
  logo: { height: 44, maxWidth: 160, objectFit: "contain" },
  headerRight: { width: "50%" },
  billToLabel: { fontSize: 9, fontWeight: 700, color: MUTED, marginBottom: 3 },
  billToTitle: { fontSize: 10.5, fontWeight: 700, color: ACCENT },
  billToCompany: { fontSize: 11, fontWeight: 700, color: "#1a2b35" },
  billToPurpose: { fontSize: 9, color: "#555", marginTop: 3 },
  billToLicense: { fontSize: 8.5, color: MUTED, marginTop: 2 },
  dateBadgeRow: { alignItems: "flex-end", marginBottom: 14 },
  dateBadge: { backgroundColor: ACCENT_2, borderRadius: 4, padding: "6 14" },
  dateBadgeLabel: { color: "#fff", fontSize: 7.5, fontWeight: 700, opacity: 0.85 },
  dateBadgeValue: { color: "#fff", fontSize: 10, fontWeight: 700, marginTop: 2 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 14,
    borderBottom: `2px solid ${LINE}`,
    paddingBottom: 10,
  },
  titleText: { fontSize: 19, fontWeight: 700, color: "#1a2b35" },
  invoiceNoText: { fontSize: 9.5, fontWeight: 700, color: "#555" },
  table: { marginBottom: 0 },
  tableHeaderRow: { flexDirection: "row", backgroundColor: ACCENT },
  th: { color: "#fff", fontSize: 8, fontWeight: 700, padding: "8 10" },
  serviceRow: { flexDirection: "row", backgroundColor: "#eef4f7", borderBottom: `1px solid ${LINE}` },
  serviceCell: { fontSize: 10, fontWeight: 700, color: "#1a2b35", padding: "7 10" },
  workerRow: { flexDirection: "row", borderBottom: `1px solid ${LINE}` },
  workerRowAlt: { backgroundColor: "#f8fbfc" },
  td: { fontSize: 9, color: "#333", padding: "7 10" },
  tdRight: { fontSize: 9.5, fontWeight: 700, color: ACCENT, padding: "7 10", textAlign: "right" },
  subtotalRow: {
    flexDirection: "row",
    backgroundColor: "#f0f4f6",
    borderTop: `2px solid ${LINE}`,
    borderBottom: `1px solid ${LINE}`,
  },
  subtotalLabel: { fontSize: 8.5, fontWeight: 700, color: "#555", padding: "7 10", textAlign: "right" },
  advanceRow: { flexDirection: "row", backgroundColor: "#fff8f0", borderBottom: `1px solid #f0ddd9` },
  spacer: { flex: 1 },
  footerRow: { flexDirection: "row", marginTop: 20 },
  footerLeft: { width: "55%", paddingRight: 16, justifyContent: "flex-end" },
  bankName: { fontSize: 9.5, fontWeight: 700, color: "#1a2b35", marginBottom: 3 },
  bankLine: { fontSize: 9, color: "#444", fontWeight: 700 },
  footerRight: { width: "45%", justifyContent: "flex-end" },
  amountBox: { backgroundColor: ACCENT, padding: "9 14", alignItems: "center" },
  amountLabel: { fontSize: 8, fontWeight: 700, color: "#fff", opacity: 0.8 },
  amountValue: { fontSize: 13, fontWeight: 700, color: "#fff", marginTop: 2 },
  methodBox: { backgroundColor: ACCENT_2, padding: "6 14", alignItems: "center" },
  methodLabel: { fontSize: 7.5, fontWeight: 700, color: "#fff", opacity: 0.85 },
  methodValue: { fontSize: 9, fontWeight: 700, color: "#fff", marginTop: 1 },
  thankYou: {
    textAlign: "center",
    marginTop: 24,
    paddingTop: 12,
    borderTop: `1px solid ${LINE}`,
  },
  thankYouText: { fontSize: 15, color: "#355B66", textAlign: "center" },
  thankYouSub: { fontSize: 8, color: MUTED, textAlign: "center", marginTop: 2 },
  contactFooter: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 14,
    paddingTop: 8,
    borderTop: `2px solid #355B66`,
  },
  contactItem: { fontSize: 7.5, color: "#666" },
  website: { textAlign: "center", marginTop: 6, fontSize: 7.5, color: "#aaa" },
});

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" }).format(d);
}
function fmtAmount(n: number) {
  return n % 1 === 0
    ? n.toLocaleString()
    : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function InvoiceDocument({
  invoice,
  logoUrl,
}: {
  invoice: Invoice & { workers: InvoiceWorker[] };
  // react-pdf can't reliably load a local file by path/URL on Windows (see
  // lib/pdf-assets.ts) — callers pass raw file bytes instead.
  logoUrl: Buffer | null;
}) {
  const subtotal = invoice.workers.reduce(
    (sum, w) => sum + Number(w.amount) * w.qty,
    0
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            {logoUrl && (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={logoUrl} style={styles.logo} />
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.billToLabel}>Bill to:</Text>
            <Text style={styles.billToTitle}>{invoice.billToTitle}</Text>
            <Text style={styles.billToCompany}>{invoice.billToCompany}</Text>
            <Text style={styles.billToPurpose}>{invoice.billToPurpose}</Text>
            <Text style={styles.billToLicense}>
              License Number: {invoice.billToLicenseNo ?? ""}
            </Text>
          </View>
        </View>

        <View style={styles.dateBadgeRow}>
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeLabel}>INVOICED DATE:</Text>
            <Text style={styles.dateBadgeValue}>{fmtDate(invoice.invoicedDate)}</Text>
          </View>
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.titleText}>Payment Invoice:</Text>
          <Text style={styles.invoiceNoText}>Invoice No: {invoice.invoiceNo}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, { width: "50%" }]}>Service</Text>
            <Text style={[styles.th, { width: "20%" }]}>Cost ({invoice.currency})</Text>
            <Text style={[styles.th, { width: "14%", textAlign: "center" }]}>Qty</Text>
            <Text style={[styles.th, { width: "16%", textAlign: "right" }]}>Total</Text>
          </View>
          <View style={styles.serviceRow}>
            <Text style={[styles.serviceCell, { width: "100%" }]}>{invoice.serviceType}</Text>
          </View>
          {invoice.workers.map((w, i) => (
            <View key={w.id} style={i % 2 === 1 ? [styles.workerRow, styles.workerRowAlt] : styles.workerRow}>
              <Text style={[styles.td, { width: "50%" }]}>• {w.name}</Text>
              <Text style={[styles.td, { width: "20%" }]}></Text>
              <Text style={[styles.td, { width: "14%", textAlign: "center" }]}>
                {String(w.qty).padStart(2, "0")}
              </Text>
              <Text style={[styles.tdRight, { width: "16%" }]}>{fmtAmount(Number(w.amount))}</Text>
            </View>
          ))}
          {invoice.advanceStatus !== "NONE" && Number(invoice.advanceAmount) > 0 && (
            <>
              <View style={styles.subtotalRow}>
                <Text style={[styles.subtotalLabel, { width: "84%" }]}>Subtotal</Text>
                <Text style={[styles.tdRight, { width: "16%" }]}>{fmtAmount(subtotal)}</Text>
              </View>
              <View style={styles.advanceRow}>
                <Text style={[styles.subtotalLabel, { width: "84%", color: invoice.advanceStatus === "PAID" ? "#c0392b" : "#9A7D0A" }]}>
                  {invoice.advanceStatus === "PAID" ? "Less: Advance Paid" : "Advance Requested"}
                </Text>
                <Text style={[styles.tdRight, { width: "16%", color: invoice.advanceStatus === "PAID" ? "#c0392b" : "#9A7D0A" }]}>
                  {invoice.advanceStatus === "PAID" ? "− " : ""}
                  {fmtAmount(Number(invoice.advanceAmount))}
                </Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.spacer} />

        <View style={styles.footerRow}>
          <View style={styles.footerLeft}>
            <Text style={styles.bankName}>{invoice.bankName}</Text>
            <Text style={styles.bankLine}>{invoice.accountNo}</Text>
            <Text style={styles.bankLine}>{invoice.accountName}</Text>
            <Text style={styles.bankLine}>SWIFT CODE: {invoice.swiftCode}</Text>
            {invoice.notes && (
              <Text style={{ fontSize: 8, color: "#777", marginTop: 5 }}>{invoice.notes}</Text>
            )}
          </View>
          <View style={styles.footerRight}>
            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>AMOUNT</Text>
              <Text style={styles.amountValue}>
                {invoice.currency} {fmtAmount(Number(invoice.total))}/-
              </Text>
            </View>
            <View style={styles.methodBox}>
              <Text style={styles.methodLabel}>PAYMENT METHOD</Text>
              <Text style={styles.methodValue}>{invoice.paymentMethod}</Text>
            </View>
          </View>
        </View>

        <View style={styles.thankYou}>
          <Text style={styles.thankYouText}>Thank you</Text>
          <Text style={styles.thankYouSub}>for considering our services</Text>
        </View>

        <View style={styles.contactFooter}>
          {invoice.footerEmail && <Text style={styles.contactItem}>{invoice.footerEmail}</Text>}
          {invoice.footerPhone && <Text style={styles.contactItem}>{invoice.footerPhone}</Text>}
          {invoice.footerFax && <Text style={styles.contactItem}>{invoice.footerFax}</Text>}
          {invoice.footerAddress && <Text style={styles.contactItem}>{invoice.footerAddress}</Text>}
        </View>
        {invoice.footerWebsite && <Text style={styles.website}>{invoice.footerWebsite}</Text>}
      </Page>
    </Document>
  );
}
