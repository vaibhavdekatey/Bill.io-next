import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// ---------------------------------------------------------------------------
// Register Lexend font from Google Fonts for the company name fallback
// ---------------------------------------------------------------------------
Font.register({
  family: "Lexend",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/lexend/v26/wlptgwvFAVdoq2_F94zlCfv0bz1WCzsW_LA.ttf",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/lexend/v26/wlptgwvFAVdoq2_F94zlCfv0bz1WC-UR_LA.ttf",
      fontWeight: 600,
    },
    {
      src: "https://fonts.gstatic.com/s/lexend/v26/wlptgwvFAVdoq2_F94zlCfv0bz1WC9wR_LA.ttf",
      fontWeight: 700,
    },
  ],
});

Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuOKfMZg.ttf",
      fontWeight: 300,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fMZg.ttf",
      fontWeight: 500,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYMZg.ttf",
      fontWeight: 600,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZg.ttf",
      fontWeight: 700,
    },
  ],
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const colors = {
  primary: "#111111",
  secondary: "#555555",
  muted: "#888888",
  border: "#E0E0E0",
  headerBg: "#F7F7F7",
  white: "#FFFFFF",
  accent: "#2563EB",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 9,
    color: colors.primary,
    backgroundColor: colors.white,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 45,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: {
    height: 24,
    objectFit: "contain" as any,
  },
  companyNameFallback: {
    fontFamily: "Lexend",
    fontSize: 22,
    fontWeight: 700,
    color: colors.primary,
    letterSpacing: -0.5,
  },
  documentTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: colors.primary,
    letterSpacing: -0.5,
    textAlign: "right" as any,
  },
  documentNumber: {
    fontSize: 10,
    color: colors.muted,
    textAlign: "right" as any,
    marginTop: 4,
  },

  // Info grid
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
    gap: 30,
  },
  infoBlock: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 8,
    fontWeight: 600,
    color: colors.muted,
    textTransform: "uppercase" as any,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 10,
    fontWeight: 500,
    color: colors.primary,
    lineHeight: 1.5,
  },
  infoValueLight: {
    fontSize: 9,
    color: colors.secondary,
    lineHeight: 1.5,
  },

  // Dates row
  datesRow: {
    flexDirection: "row",
    backgroundColor: colors.headerBg,
    borderRadius: 6,
    padding: 14,
    marginBottom: 28,
    gap: 30,
  },
  dateBlock: {
    flex: 1,
  },

  // Table
  table: {
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableHeaderText: {
    fontSize: 8,
    fontWeight: 600,
    color: colors.white,
    textTransform: "uppercase" as any,
    letterSpacing: 0.8,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowAlt: {
    backgroundColor: "#FAFAFA",
  },
  tableCellDesc: {
    flex: 3,
    fontSize: 9,
    color: colors.primary,
  },
  tableCellQty: {
    flex: 1,
    fontSize: 9,
    color: colors.secondary,
    textAlign: "right" as any,
  },
  tableCellPrice: {
    flex: 1.5,
    fontSize: 9,
    color: colors.secondary,
    textAlign: "right" as any,
  },
  tableCellAmount: {
    flex: 1.5,
    fontSize: 9,
    fontWeight: 600,
    color: colors.primary,
    textAlign: "right" as any,
  },

  // Summary
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  summaryBlock: {
    width: 220,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 9,
    color: colors.secondary,
  },
  summaryValue: {
    fontSize: 9,
    color: colors.primary,
    fontWeight: 500,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    marginTop: 6,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.primary,
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.primary,
  },

  // Footer
  footer: {
    position: "absolute" as any,
    bottom: 30,
    left: 45,
    right: 45,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    fontSize: 7,
    color: colors.muted,
    textAlign: "center" as any,
    flexDirection: "column" as any,
    alignItems: "center" as any,
    gap: 4,
  },
  statusBadge: {
    fontSize: 8,
    fontWeight: 700,
    textTransform: "uppercase" as any,
    letterSpacing: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
    textAlign: "right" as any,
    alignSelf: "flex-end" as any,
  },
});

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
const formatCurrency = (amount: number, currency: string = "INR") => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatAddress = (addr: any): string => {
  if (!addr) return "";
  if (typeof addr === "string") return addr;
  if (typeof addr === "object") {
    if (addr.full) return addr.full;
    if (addr.address) return addr.address;
    const lines = [addr.line1, addr.line2, addr.line3].filter(Boolean);
    const cityStateZip = [addr.city, addr.state, addr.pincode]
      .filter(Boolean)
      .join(", ");
    if (cityStateZip) lines.push(cityStateZip);
    return lines.join("\n");
  }
  return "";
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "PAID":
      return { bg: "#ECFDF5", color: "#059669" };
    case "SENT":
      return { bg: "#EFF6FF", color: "#2563EB" };
    case "DRAFT":
      return { bg: "#F5F5F5", color: "#737373" };
    case "CANCELLED":
      return { bg: "#FEF2F2", color: "#DC2626" };
    case "ACCEPTED":
      return { bg: "#ECFDF5", color: "#059669" };
    case "REJECTED":
      return { bg: "#FEF2F2", color: "#DC2626" };
    default:
      return { bg: "#F5F5F5", color: "#737373" };
  }
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface PDFDocumentData {
  type: "INVOICE" | "QUOTATION";
  number: string;
  status: string;
  currency: string;
  issueDate: string;
  dueDate?: string | null;
  validUntil?: string | null;
  subtotal: number;
  taxTotal: number;
  discount: number;
  total: number;
  issuerName: string;
  issuerCompany: string;
  issuerAddress: any;
  issuerEmail?: string | null;
  issuerPhone?: string | null;
  issuerWebsite?: string | null;
  clientName: string;
  clientCompany: string | null;
  clientAddress: any;
  clientEmail?: string | null;
  clientPhone?: string | null;
  notes?: string | null;
  terms?: string | null;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  // Organization info for the header
  logoUrl?: string | null;
  organizationName?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function BillPDF({ data }: { data: PDFDocumentData }) {
  const isInvoice = data.type === "INVOICE";
  const title = isInvoice ? "Invoice" : "Quotation";
  const dateLabel = isInvoice ? "Due Date" : "Valid Until";
  const dateValue = isInvoice ? data.dueDate : data.validUntil;
  const totalLabel = isInvoice ? "Total Due" : "Total";

  const issuerAddr = formatAddress(data.issuerAddress);
  const clientAddr = formatAddress(data.clientAddress);

  // Resolve the full logo URL
  let resolvedLogoUrl: string | null = null;
  if (data.logoUrl) {
    if (data.logoUrl.startsWith("http") || data.logoUrl.startsWith("data:")) {
      resolvedLogoUrl = data.logoUrl;
    } else {
      // Local upload: prepend the backend base URL
      resolvedLogoUrl = `http://localhost:3000${data.logoUrl}`;
    }
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ============ HEADER ============ */}
        <View style={styles.header}>
          <View>
            {resolvedLogoUrl ? (
              <Image src={resolvedLogoUrl} style={styles.logo} />
            ) : (
              <Text style={styles.companyNameFallback}>
                {data.organizationName || data.issuerCompany}
              </Text>
            )}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.documentTitle}>{title}</Text>
            <Text style={styles.documentNumber}>{data.number}</Text>
          </View>
        </View>

        {/* ============ FROM / TO ============ */}
        <View style={styles.infoGrid}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>From</Text>
            <Text style={styles.infoValue}>{data.issuerName}</Text>
            {data.issuerCompany && data.issuerCompany !== data.issuerName && (
              <Text style={styles.infoValueLight}>{data.issuerCompany}</Text>
            )}
            {issuerAddr ? (
              <Text style={styles.infoValueLight}>{issuerAddr}</Text>
            ) : null}
            {data.issuerEmail && data.issuerEmail !== "Email not set" && (
              <Text style={styles.infoValueLight}>{data.issuerEmail}</Text>
            )}
            {data.issuerPhone && data.issuerPhone !== "Phone not set" && (
              <Text style={styles.infoValueLight}>{data.issuerPhone}</Text>
            )}
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Billed To</Text>
            <Text style={styles.infoValue}>{data.clientName}</Text>
            {data.clientCompany && (
              <Text style={styles.infoValueLight}>{data.clientCompany}</Text>
            )}
            {clientAddr ? (
              <Text style={styles.infoValueLight}>{clientAddr}</Text>
            ) : null}
            {data.clientEmail && data.clientEmail !== "Email not set" && (
              <Text style={styles.infoValueLight}>{data.clientEmail}</Text>
            )}
            {data.clientPhone && data.clientPhone !== "Phone not set" && (
              <Text style={styles.infoValueLight}>{data.clientPhone}</Text>
            )}
          </View>
        </View>

        {/* ============ DATES ============ */}
        <View style={styles.datesRow}>
          <View style={styles.dateBlock}>
            <Text style={styles.infoLabel}>Issue Date</Text>
            <Text style={styles.infoValue}>{formatDate(data.issueDate)}</Text>
          </View>
          <View style={styles.dateBlock}>
            <Text style={styles.infoLabel}>{dateLabel}</Text>
            <Text style={styles.infoValue}>
              {formatDate(dateValue as string)}
            </Text>
          </View>
          <View style={styles.dateBlock}>
            <Text style={styles.infoLabel}>Currency</Text>
            <Text style={styles.infoValue}>{data.currency}</Text>
          </View>
        </View>

        {/* ============ LINE ITEMS TABLE ============ */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 3 }]}>
              Description
            </Text>
            <Text
              style={[
                styles.tableHeaderText,
                { flex: 1, textAlign: "right" as any },
              ]}
            >
              Qty
            </Text>
            <Text
              style={[
                styles.tableHeaderText,
                { flex: 1.5, textAlign: "right" as any },
              ]}
            >
              Unit Price
            </Text>
            <Text
              style={[
                styles.tableHeaderText,
                { flex: 1.5, textAlign: "right" as any },
              ]}
            >
              Amount
            </Text>
          </View>

          {/* Rows */}
          {data.items.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.tableRow,
                index % 2 !== 0 ? styles.tableRowAlt : {},
              ]}
            >
              <Text style={styles.tableCellDesc}>{item.description}</Text>
              <Text style={styles.tableCellQty}>{Number(item.quantity)}</Text>
              <Text style={styles.tableCellPrice}>
                {formatCurrency(Number(item.unitPrice), data.currency)}
              </Text>
              <Text style={styles.tableCellAmount}>
                {formatCurrency(Number(item.total), data.currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* ============ SUMMARY AND NOTES ============ */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
          {/* Notes and Terms */}
          <View style={{ flex: 1, paddingRight: 20 }}>
            {data.notes && (
              <View style={{ marginBottom: 10, padding: 10, backgroundColor: "#F9FAFB", borderRadius: 6, borderWidth: 1, borderColor: "#E5E7EB" }}>
                <Text style={{ fontSize: 9, color: colors.secondary, marginBottom: 4, textTransform: "uppercase" as any }}>
                  Client Note
                </Text>
                <Text style={{ fontSize: 9, color: colors.primary }}>
                  {data.notes}
                </Text>
              </View>
            )}
            {data.terms && (
              <View style={{ padding: 10, backgroundColor: "#F9FAFB", borderRadius: 6, borderWidth: 1, borderColor: "#E5E7EB" }}>
                <Text style={{ fontSize: 9, color: colors.secondary, marginBottom: 4, textTransform: "uppercase" as any }}>
                  Terms & Conditions
                </Text>
                <Text style={{ fontSize: 9, color: colors.primary }}>
                  {data.terms}
                </Text>
              </View>
            )}
          </View>

          {/* Calculations Summary */}
          <View style={styles.summaryBlock}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(Number(data.subtotal), data.currency)}
              </Text>
            </View>

            {Number(data.discount) > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Discount ({Number(data.discount)}%)
                </Text>
                <Text style={[styles.summaryValue, { color: "#059669" }]}>
                  -
                  {formatCurrency(
                    (Number(data.subtotal) * Number(data.discount)) / 100,
                    data.currency,
                  )}
                </Text>
              </View>
            )}

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(Number(data.taxTotal), data.currency)}
              </Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{totalLabel}</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(Number(data.total), data.currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* ============ FOOTER ============ */}
        <View style={styles.footer}>
          <Text>
            {data.organizationName || data.issuerCompany} • {title} {data.number}{" "}
            • Generated on{" "}
            {new Date().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
          {data.issuerWebsite && data.issuerWebsite !== "Website not set" && (
            <Text>{data.issuerWebsite}</Text>
          )}
        </View>
      </Page>
    </Document>
  );
}
