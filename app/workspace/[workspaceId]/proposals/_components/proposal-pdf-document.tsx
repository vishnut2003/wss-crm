"use client";

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ProposalDocument } from "@/lib/proposal-ai";

const styles = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontSize: 11,
    lineHeight: 1.45,
    color: "#18181b",
    fontFamily: "Helvetica",
  },
  headerBar: {
    height: 6,
    width: 56,
    backgroundColor: "#8e51ff",
    marginBottom: 18,
    borderRadius: 2,
  },
  title: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    color: "#0f172a",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    marginBottom: 22,
    fontSize: 10,
    color: "#475569",
  },
  metaBlock: { flexDirection: "column", maxWidth: "48%" },
  metaLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#94a3b8",
    marginBottom: 3,
  },
  metaValue: { fontSize: 10.5, color: "#0f172a" },
  summaryLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: "#94a3b8",
    marginBottom: 6,
  },
  summary: {
    fontSize: 11,
    marginBottom: 22,
    color: "#1e293b",
  },
  sectionHeading: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginTop: 14,
    marginBottom: 6,
    color: "#0f172a",
  },
  sectionBody: { fontSize: 10.5, color: "#1f2937", marginBottom: 4 },
  bulletRow: {
    flexDirection: "row",
    marginTop: 3,
  },
  bulletDot: {
    width: 10,
    fontSize: 10.5,
    color: "#8e51ff",
  },
  bulletText: { flex: 1, fontSize: 10.5, color: "#1f2937" },

  pricingTable: { marginTop: 12, marginBottom: 8 },
  pricingHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 4,
    marginBottom: 4,
  },
  pricingRow: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f1f5f9",
  },
  pricingTotalRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: "#0f172a",
    marginTop: 4,
  },
  cellDesc: { flex: 4, fontSize: 10.5 },
  cellQty: { flex: 1, fontSize: 10.5, textAlign: "right" },
  cellUnit: { flex: 1.5, fontSize: 10.5, textAlign: "right" },
  cellTotal: {
    flex: 1.5,
    fontSize: 10.5,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
  },
  cellHeader: { color: "#64748b", fontSize: 9.5, textTransform: "uppercase" },

  termsItem: { flexDirection: "row", marginTop: 3 },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 48,
    right: 48,
    fontSize: 9,
    color: "#94a3b8",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency.length === 3 ? currency.toUpperCase() : "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("en-IN")}`;
  }
}

export function ProposalPdfDocument({ data }: { data: ProposalDocument }) {
  const totalAmount = data.pricing
    ? data.pricing.items.reduce(
        (sum, item) => sum + item.unitPrice * (item.quantity ?? 1),
        0,
      )
    : 0;

  return (
    <Document
      title={data.title}
      author={data.preparedBy.company}
      subject={`Proposal for ${data.client.name}`}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBar} />
        <Text style={styles.title}>{data.title}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Prepared for</Text>
            <Text style={styles.metaValue}>{data.client.name}</Text>
            {data.client.company ? (
              <Text style={styles.metaValue}>{data.client.company}</Text>
            ) : null}
            {data.client.address ? (
              <Text style={styles.metaValue}>{data.client.address}</Text>
            ) : null}
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Prepared by</Text>
            <Text style={styles.metaValue}>{data.preparedBy.name}</Text>
            <Text style={styles.metaValue}>{data.preparedBy.company}</Text>
            {data.preparedBy.email ? (
              <Text style={styles.metaValue}>{data.preparedBy.email}</Text>
            ) : null}
            <Text style={styles.metaValue}>{data.date}</Text>
          </View>
        </View>

        <Text style={styles.summaryLabel}>Executive summary</Text>
        <Text style={styles.summary}>{data.summary}</Text>

        {data.sections.map((section, idx) => (
          <View key={`section-${idx}`}>
            <Text style={styles.sectionHeading}>{section.heading}</Text>
            {section.body ? (
              <Text style={styles.sectionBody}>{section.body}</Text>
            ) : null}
            {section.bullets?.map((b, i) => (
              <View key={`b-${idx}-${i}`} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{b}</Text>
              </View>
            ))}
          </View>
        ))}

        {data.pricing ? (
          <View style={styles.pricingTable}>
            <Text style={styles.sectionHeading}>Investment</Text>
            <View style={styles.pricingHeaderRow}>
              <Text style={[styles.cellDesc, styles.cellHeader]}>Item</Text>
              <Text style={[styles.cellQty, styles.cellHeader]}>Qty</Text>
              <Text style={[styles.cellUnit, styles.cellHeader]}>Unit</Text>
              <Text style={[styles.cellTotal, styles.cellHeader]}>Total</Text>
            </View>
            {data.pricing.items.map((item, idx) => {
              const qty = item.quantity ?? 1;
              const lineTotal = item.unitPrice * qty;
              return (
                <View key={`item-${idx}`} style={styles.pricingRow}>
                  <Text style={styles.cellDesc}>{item.description}</Text>
                  <Text style={styles.cellQty}>{qty}</Text>
                  <Text style={styles.cellUnit}>
                    {formatCurrency(item.unitPrice, data.pricing!.currency)}
                  </Text>
                  <Text style={styles.cellTotal}>
                    {formatCurrency(lineTotal, data.pricing!.currency)}
                  </Text>
                </View>
              );
            })}
            <View style={styles.pricingTotalRow}>
              <Text style={styles.cellDesc}>Total</Text>
              <Text style={styles.cellQty}></Text>
              <Text style={styles.cellUnit}></Text>
              <Text style={styles.cellTotal}>
                {formatCurrency(totalAmount, data.pricing.currency)}
              </Text>
            </View>
            {data.pricing.notes ? (
              <Text style={[styles.sectionBody, { marginTop: 6 }]}>
                {data.pricing.notes}
              </Text>
            ) : null}
          </View>
        ) : null}

        {data.timeline && data.timeline.length ? (
          <View>
            <Text style={styles.sectionHeading}>Timeline</Text>
            {data.timeline.map((t, idx) => (
              <View key={`t-${idx}`} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={{ fontFamily: "Helvetica-Bold" }}>
                    {t.when}
                  </Text>{" "}
                  — {t.milestone}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {data.terms && data.terms.length ? (
          <View>
            <Text style={styles.sectionHeading}>Terms</Text>
            {data.terms.map((t, idx) => (
              <View key={`term-${idx}`} style={styles.termsItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{t}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.footer} fixed>
          <Text>{data.preparedBy.company}</Text>
          <Text>{data.date}</Text>
        </View>
      </Page>
    </Document>
  );
}
