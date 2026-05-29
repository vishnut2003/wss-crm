"use client";

import {
  Defs,
  Document,
  LinearGradient,
  Page,
  Rect,
  Stop,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";
import {
  PURCHASE_INVOICE_STATUS_LABEL,
  lineSubtotal,
  lineTax,
  type PurchaseInvoiceStatus,
} from "@/lib/voucher";

export type PurchaseInvoicePdfCompany = {
  legalName: string;
  displayName: string;
  email: string;
  phone: string;
  website: string;
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  gstin: string;
  pan: string;
  cin: string;
  bank: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    ifsc: string;
    branch: string;
    upiId: string;
  };
};

export type PurchaseInvoicePdfData = {
  number: string;
  vendorBillNumber: string;
  status: PurchaseInvoiceStatus;
  currency: string;
  invoiceDate: string;
  dueDate: string | null;
  vendor: {
    name: string;
    company: string;
    email: string;
    gstin: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
  }>;
  subtotal: number;
  taxTotal: number;
  discount: number;
  total: number;
  amountPaid: number;
  notes: string;
};

const BRAND_PRIMARY = "#8C00FF";
const BRAND_DEEP = "#450693";
const INK = "#0f172a";
const INK_SOFT = "#1f2937";
const TEXT = "#334155";
const MUTED = "#64748b";
const MUTED_SOFT = "#94a3b8";
const LINE = "#e2e8f0";
const LINE_SOFT = "#f1f5f9";
const TINT = "#f5f0ff";
const PAGE_W = 595.28;
const HERO_H = 150;
const PAD_X = 48;

const STATUS_PILL: Record<PurchaseInvoiceStatus, { bg: string; fg: string }> = {
  unpaid: { bg: "#ffffff", fg: BRAND_DEEP },
  partial: { bg: "#fef3c7", fg: "#b45309" },
  paid: { bg: "#d1fae5", fg: "#047857" },
  overdue: { bg: "#fee2e2", fg: "#b91c1c" },
  cancelled: { bg: "#e2e8f0", fg: "#475569" },
};

const styles = StyleSheet.create({
  page: {
    paddingBottom: 32,
    fontSize: 10,
    lineHeight: 1.45,
    color: INK,
    fontFamily: "Helvetica",
    flexDirection: "column",
  },
  spacer: { flexGrow: 1 },

  hero: { position: "relative", height: HERO_H, marginBottom: 24 },
  heroSvg: { position: "absolute", top: 0, left: 0 },
  heroContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 28,
    paddingHorizontal: PAD_X,
    paddingBottom: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroLeft: { maxWidth: "62%" },
  brandMark: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ffffff",
  },
  brandText: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    letterSpacing: 1.6,
  },
  eyebrow: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 3,
    color: "#e9d5ff",
    marginBottom: 4,
  },
  heroNumber: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  heroSubNumber: {
    fontSize: 9.5,
    color: "#e9d5ff",
    marginTop: 4,
  },
  heroRight: { alignItems: "flex-end" },
  statusPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  heroMeta: { marginTop: 10, alignItems: "flex-end" },
  heroMetaLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.2,
    color: "#e9d5ff",
  },
  heroMetaValue: { fontSize: 10.5, color: "#ffffff", marginTop: 1 },

  cardsRow: {
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: PAD_X,
    marginBottom: 22,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 6,
    padding: 14,
    backgroundColor: "#ffffff",
  },
  cardAccent: {
    height: 3,
    width: 24,
    backgroundColor: BRAND_PRIMARY,
    marginBottom: 10,
    borderRadius: 1.5,
  },
  cardLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.4,
    color: MUTED_SOFT,
    marginBottom: 6,
  },
  cardName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: INK,
    marginBottom: 2,
  },
  cardLine: { fontSize: 9.5, color: INK_SOFT, marginTop: 1.5 },
  cardSubtle: { fontSize: 9, color: MUTED, marginTop: 1.5 },

  body: { paddingHorizontal: PAD_X },
  table: { marginTop: 4 },
  headerRow: {
    flexDirection: "row",
    backgroundColor: BRAND_DEEP,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: LINE_SOFT,
  },
  rowAlt: { backgroundColor: "#fafafa" },
  cellHeader: {
    color: "#ffffff",
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.1,
  },
  cellDesc: { flex: 4, fontSize: 10, color: INK_SOFT },
  cellQty: { flex: 1, fontSize: 10, textAlign: "right", color: INK_SOFT },
  cellUnit: { flex: 1.6, fontSize: 10, textAlign: "right", color: INK_SOFT },
  cellTax: { flex: 1, fontSize: 10, textAlign: "right", color: INK_SOFT },
  cellAmount: {
    flex: 1.8,
    fontSize: 10,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
    color: INK,
  },

  totalsWrap: {
    marginTop: 16,
    marginLeft: "auto",
    width: "55%",
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 6,
    overflow: "hidden",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  totalsLabel: { fontSize: 10, color: MUTED },
  totalsValue: { fontSize: 10, color: INK, fontFamily: "Helvetica-Bold" },
  totalsGrand: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: TINT,
    borderTopWidth: 1,
    borderTopColor: LINE,
  },
  grandLabel: {
    fontSize: 10.5,
    color: BRAND_DEEP,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.6,
  },
  grandValue: {
    fontSize: 12,
    color: BRAND_DEEP,
    fontFamily: "Helvetica-Bold",
  },
  totalsPaid: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#ffffff",
    borderTopWidth: 0.5,
    borderTopColor: LINE,
  },
  paidLabel: { fontSize: 10, color: "#047857" },
  paidValue: {
    fontSize: 10,
    color: "#047857",
    fontFamily: "Helvetica-Bold",
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: BRAND_DEEP,
  },
  balanceLabel: {
    fontSize: 11,
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
  },
  balanceValue: {
    fontSize: 14,
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
  },

  block: {
    marginTop: 18,
    borderLeftWidth: 3,
    borderLeftColor: BRAND_PRIMARY,
    paddingLeft: 12,
  },
  blockHeading: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: INK,
    letterSpacing: 0.4,
    marginBottom: 5,
  },
  blockBody: { fontSize: 9.5, color: TEXT, lineHeight: 1.55 },

  footer: {
    marginTop: 16,
    marginHorizontal: PAD_X,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderTopWidth: 0.5,
    borderTopColor: LINE,
    paddingTop: 12,
  },
  footerLeft: { flexDirection: "column" },
  footerBrandRow: { flexDirection: "row", alignItems: "center" },
  footerBrandDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: BRAND_PRIMARY,
    marginRight: 6,
  },
  footerBrandName: {
    fontSize: 9,
    color: INK,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.8,
  },
  footerNumber: {
    fontSize: 8,
    color: MUTED,
    marginTop: 3,
    letterSpacing: 0.3,
  },
  footerCenter: { flex: 1, paddingHorizontal: 16 },
  footerThanks: {
    fontSize: 9,
    color: BRAND_DEEP,
    fontFamily: "Helvetica-Oblique",
    textAlign: "center",
  },
  footerContact: {
    fontSize: 7.5,
    color: MUTED,
    textAlign: "center",
    marginTop: 3,
    letterSpacing: 0.2,
  },
  footerRight: { alignItems: "flex-end" },
  footerPageLabel: {
    fontSize: 7,
    color: MUTED_SOFT,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.6,
  },
  footerPage: {
    fontSize: 9.5,
    color: INK,
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
    letterSpacing: 0.6,
  },
});

function fmt(amount: number, currency: string): string {
  const formatted = amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency} ${formatted}`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function joinAddress(parts: Array<string | undefined>): string {
  return parts.filter((p) => p && p.trim().length > 0).join(", ");
}

function HeroBackground() {
  return (
    <Svg width={PAGE_W} height={HERO_H} style={styles.heroSvg}>
      <Defs>
        <LinearGradient id="piHero" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={BRAND_DEEP} />
          <Stop offset="1" stopColor={BRAND_PRIMARY} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={PAGE_W} height={HERO_H} fill="url(#piHero)" />
      <Rect
        x={PAGE_W - 160}
        y={-50}
        width={200}
        height={200}
        rx={100}
        ry={100}
        fill="#ffffff"
        fillOpacity={0.06}
      />
      <Rect
        x={PAGE_W - 70}
        y={80}
        width={140}
        height={140}
        rx={70}
        ry={70}
        fill="#ffffff"
        fillOpacity={0.05}
      />
    </Svg>
  );
}

function Footer({
  brand,
  number,
  vendorName,
  contact,
}: {
  brand: string;
  number: string;
  vendorName: string;
  contact: { email: string; phone: string; website: string };
}) {
  const contactParts = [contact.email, contact.phone, contact.website].filter(
    (p) => p.trim().length > 0,
  );
  return (
    <View style={styles.footer}>
      <View style={styles.footerLeft}>
        <View style={styles.footerBrandRow}>
          <View style={styles.footerBrandDot} />
          <Text style={styles.footerBrandName}>{brand.toUpperCase()}</Text>
        </View>
        <Text style={styles.footerNumber}>{number}</Text>
      </View>

      <View style={styles.footerCenter}>
        <Text style={styles.footerThanks}>
          Recorded vendor bill from {vendorName}.
        </Text>
        {contactParts.length > 0 ? (
          <Text style={styles.footerContact}>
            {contactParts.join("  ·  ")}
          </Text>
        ) : null}
      </View>

      <View style={styles.footerRight}>
        <Text style={styles.footerPageLabel}>PAGE</Text>
        <Text
          style={styles.footerPage}
          render={({ pageNumber, totalPages }) =>
            `${String(pageNumber).padStart(2, "0")} / ${String(totalPages).padStart(2, "0")}`
          }
        />
      </View>
    </View>
  );
}

export function PurchaseInvoicePdfDocument({
  company,
  invoice,
}: {
  company: PurchaseInvoicePdfCompany;
  invoice: PurchaseInvoicePdfData;
}) {
  const buyerName = company.displayName || company.legalName;
  const cityLine = joinAddress([
    company.address.city,
    company.address.state,
    company.address.postalCode,
  ]);
  const pill = STATUS_PILL[invoice.status];
  const balanceDue = Math.max(invoice.total - invoice.amountPaid, 0);
  const showPaidRows = invoice.amountPaid > 0 || invoice.status === "paid";

  return (
    <Document
      title={`Purchase Invoice ${invoice.number}`}
      author={company.legalName}
      subject={`Purchase Invoice from ${invoice.vendor.name}`}
    >
      <Page size="A4" style={styles.page}>
        {/* ─── Hero ─── */}
        <View style={styles.hero}>
          <HeroBackground />
          <View style={styles.heroContent}>
            <View style={styles.heroLeft}>
              <View style={styles.brandMark}>
                <View style={styles.brandDot} />
                <Text style={styles.brandText}>{buyerName.toUpperCase()}</Text>
              </View>
              <Text style={styles.eyebrow}>PURCHASE INVOICE</Text>
              <Text style={styles.heroNumber}>{invoice.number}</Text>
              {invoice.vendorBillNumber ? (
                <Text style={styles.heroSubNumber}>
                  Vendor ref · {invoice.vendorBillNumber}
                </Text>
              ) : null}
            </View>
            <View style={styles.heroRight}>
              <Text
                style={[
                  styles.statusPill,
                  { backgroundColor: pill.bg, color: pill.fg },
                ]}
              >
                {PURCHASE_INVOICE_STATUS_LABEL[invoice.status]}
              </Text>
              <View style={styles.heroMeta}>
                <Text style={styles.heroMetaLabel}>INVOICE DATE</Text>
                <Text style={styles.heroMetaValue}>
                  {fmtDate(invoice.invoiceDate)}
                </Text>
              </View>
              <View style={styles.heroMeta}>
                <Text style={styles.heroMetaLabel}>DUE DATE</Text>
                <Text style={styles.heroMetaValue}>
                  {fmtDate(invoice.dueDate)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ─── Billed By / Billed To cards ─── */}
        <View style={styles.cardsRow}>
          <View style={styles.card}>
            <View style={styles.cardAccent} />
            <Text style={styles.cardLabel}>BILLED BY</Text>
            <Text style={styles.cardName}>{invoice.vendor.name}</Text>
            {invoice.vendor.company ? (
              <Text style={styles.cardLine}>{invoice.vendor.company}</Text>
            ) : null}
            {invoice.vendor.email ? (
              <Text style={styles.cardSubtle}>{invoice.vendor.email}</Text>
            ) : null}
            {invoice.vendor.gstin ? (
              <Text style={styles.cardSubtle}>
                GSTIN: {invoice.vendor.gstin}
              </Text>
            ) : null}
          </View>

          <View style={styles.card}>
            <View style={styles.cardAccent} />
            <Text style={styles.cardLabel}>BILLED TO</Text>
            <Text style={styles.cardName}>{buyerName}</Text>
            {company.legalName !== buyerName ? (
              <Text style={styles.cardLine}>{company.legalName}</Text>
            ) : null}
            {company.address.line1 ? (
              <Text style={styles.cardSubtle}>{company.address.line1}</Text>
            ) : null}
            {company.address.line2 ? (
              <Text style={styles.cardSubtle}>{company.address.line2}</Text>
            ) : null}
            {cityLine ? (
              <Text style={styles.cardSubtle}>{cityLine}</Text>
            ) : null}
            {company.address.country ? (
              <Text style={styles.cardSubtle}>{company.address.country}</Text>
            ) : null}
            {company.gstin ? (
              <Text style={styles.cardSubtle}>GSTIN: {company.gstin}</Text>
            ) : null}
            {company.pan ? (
              <Text style={styles.cardSubtle}>PAN: {company.pan}</Text>
            ) : null}
            <View style={{ marginTop: 8 }}>
              <Text style={styles.cardLabel}>CURRENCY</Text>
              <Text style={styles.cardLine}>{invoice.currency}</Text>
            </View>
          </View>
        </View>

        {/* ─── Body ─── */}
        <View style={styles.body}>
          <View style={styles.table}>
            <View style={styles.headerRow}>
              <Text style={[styles.cellDesc, styles.cellHeader]}>
                DESCRIPTION
              </Text>
              <Text style={[styles.cellQty, styles.cellHeader]}>QTY</Text>
              <Text style={[styles.cellUnit, styles.cellHeader]}>
                UNIT PRICE
              </Text>
              <Text style={[styles.cellTax, styles.cellHeader]}>TAX</Text>
              <Text style={[styles.cellAmount, styles.cellHeader]}>AMOUNT</Text>
            </View>
            {invoice.items.map((item, idx) => {
              const amount = lineSubtotal(item) + lineTax(item);
              return (
                <View
                  key={`item-${idx}`}
                  style={[styles.row, idx % 2 === 1 ? styles.rowAlt : {}]}
                  wrap={false}
                >
                  <Text style={styles.cellDesc}>{item.description}</Text>
                  <Text style={styles.cellQty}>{item.quantity}</Text>
                  <Text style={styles.cellUnit}>
                    {fmt(item.unitPrice, invoice.currency)}
                  </Text>
                  <Text style={styles.cellTax}>{item.taxRate}%</Text>
                  <Text style={styles.cellAmount}>
                    {fmt(amount, invoice.currency)}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={styles.totalsWrap} wrap={false}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>
                {fmt(invoice.subtotal, invoice.currency)}
              </Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Tax</Text>
              <Text style={styles.totalsValue}>
                {fmt(invoice.taxTotal, invoice.currency)}
              </Text>
            </View>
            {invoice.discount > 0 ? (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Discount</Text>
                <Text style={styles.totalsValue}>
                  -{fmt(invoice.discount, invoice.currency)}
                </Text>
              </View>
            ) : null}
            <View style={styles.totalsGrand}>
              <Text style={styles.grandLabel}>INVOICE TOTAL</Text>
              <Text style={styles.grandValue}>
                {fmt(invoice.total, invoice.currency)}
              </Text>
            </View>
            {showPaidRows ? (
              <View style={styles.totalsPaid}>
                <Text style={styles.paidLabel}>Amount paid</Text>
                <Text style={styles.paidValue}>
                  -{fmt(invoice.amountPaid, invoice.currency)}
                </Text>
              </View>
            ) : null}
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>BALANCE DUE</Text>
              <Text style={styles.balanceValue}>
                {fmt(balanceDue, invoice.currency)}
              </Text>
            </View>
          </View>

          {invoice.notes ? (
            <View style={styles.block} minPresenceAhead={60}>
              <Text style={styles.blockHeading}>Notes</Text>
              <Text style={styles.blockBody}>{invoice.notes}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.spacer} />
        <Footer
          brand={company.legalName || buyerName}
          vendorName={invoice.vendor.name}
          number={invoice.number}
          contact={{
            email: company.email,
            phone: company.phone,
            website: company.website,
          }}
        />
      </Page>
    </Document>
  );
}
