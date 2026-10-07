"use client";

import { useEffect, useState, useMemo, use } from "react";
import axios from "axios";
import { pdf } from "@react-pdf/renderer";
import BillPDF, { PDFDocumentData } from "@/components/BillPDF";
import { formatCurrency } from "@/lib/utils/calculations";
import { Download, Printer, CheckCircle, Clock, AlertCircle, Building, Copy, Check } from "lucide-react";
import { DocumentSkeleton } from "@/components/Skeleton";

export default function PublicInvoicePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    axios
      .get(`/api/public/invoices/${token}`)
      .then((res) => {
        if (res.data?.success) {
          setInvoice(res.data.data);
        } else {
          setError(res.data?.message || "Failed to load invoice");
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Invoice not found or invalid link");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    try {
      setDownloadingPdf(true);

      const pdfData: PDFDocumentData = {
        type: "INVOICE",
        number: invoice.number,
        status: invoice.status,
        currency: invoice.currency,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        subtotal: Number(invoice.subtotal),
        taxTotal: Number(invoice.taxTotal),
        discount: Number(invoice.discount),
        discountRemark: invoice.discountRemark,
        total: Number(invoice.total),
        issuerName: invoice.issuerName,
        issuerCompany: invoice.issuerCompany,
        issuerAddress: invoice.issuerAddress,
        issuerEmail: invoice.issuerEmail,
        issuerPhone: invoice.issuerPhone,
        issuerWebsite: invoice.issuerWebsite,
        clientName: invoice.clientName,
        clientCompany: invoice.clientCompany,
        clientAddress: invoice.clientAddress,
        clientEmail: invoice.clientEmail,
        clientPhone: invoice.clientPhone,
        notes: invoice.notes,
        terms: invoice.terms,
        bankDetails: (invoice.issuerBankDetails as any) || (invoice.Organization as any)?.bankDetails,
        items: invoice.InvoiceItem.map((item: any) => ({
          id: item.id,
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          total: Number(item.total),
        })),
        logoUrl: invoice.Organization?.logoUrl || null,
        organizationName: invoice.Organization?.name || invoice.issuerCompany,
      };

      // Pre-fetch logo to Base64 if needed
      if (pdfData.logoUrl && pdfData.logoUrl.startsWith("http")) {
        try {
          const res = await fetch(pdfData.logoUrl);
          const blob = await res.blob();
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          pdfData.logoUrl = base64;
        } catch (e) {
          console.error("Failed to convert logo to base64:", e);
        }
      }

      const blob = await pdf(<BillPDF data={pdfData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${invoice.number}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const bankDetails = (invoice?.issuerBankDetails as any) || (invoice?.Organization as any)?.bankDetails;

  const isOverdue =
    invoice?.status === "SENT" && invoice?.dueDate && new Date(invoice.dueDate) < new Date();

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-4 font-lexend">
        <DocumentSkeleton isPublic />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 font-lexend">
        <div className="max-w-md w-full bg-neutral-950 border border-neutral-800 rounded-3xl p-8 text-center flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-light text-white">Invoice Unavailable</h1>
          <p className="text-sm text-neutral-400 font-light">{error || "This invoice link is invalid or has expired."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-12 px-4 sm:px-6 lg:px-8 font-lexend">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
          <div className="flex flex-col items-start gap-1">
            <div className="h-7">
              <img src="/bill.io_ico.svg" alt="Bill.io" className="h-full w-auto" />
            </div>
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-light">
              Client Portal
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => window.print()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900 text-neutral-300 text-xs font-light transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPdf}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white text-black hover:bg-neutral-200 disabled:bg-neutral-700 disabled:text-neutral-400 text-xs font-medium transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              {downloadingPdf ? "Generating PDF..." : "Download PDF"}
            </button>
          </div>
        </div>

        {/* Invoice Main Sheet */}
        <div className="bg-neutral-950 border border-neutral-800/80 rounded-3xl p-6 sm:p-12 shadow-2xl flex flex-col gap-10">
          {/* Header & Status */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
            <div className="flex flex-col gap-3">
              {invoice.Organization?.logoUrl ? (
                <img
                  src={invoice.Organization.logoUrl}
                  alt={invoice.issuerCompany}
                  className="h-12 w-auto max-w-[180px] object-contain rounded-md"
                />
              ) : (
                <h2 className="text-2xl font-normal text-white">
                  {invoice.issuerCompany || invoice.Organization?.name}
                </h2>
              )}
              <div className="flex flex-col text-xs text-neutral-400 font-light leading-relaxed">
                {invoice.issuerEmail && <span>{invoice.issuerEmail}</span>}
                {invoice.issuerPhone && <span>{invoice.issuerPhone}</span>}
                {invoice.issuerWebsite && <span>{invoice.issuerWebsite}</span>}
                {invoice.Organization?.taxId && (
                  <span className="mt-1 text-neutral-500">Tax ID: {invoice.Organization.taxId}</span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-2">
              <span className="text-xs uppercase tracking-widest text-neutral-500 font-light">INVOICE</span>
              <span className="text-2xl font-light text-white">{invoice.number}</span>
              <div className="mt-1">
                {invoice.status === "PAID" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle className="w-3.5 h-3.5" /> Paid
                  </span>
                ) : isOverdue ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                    <AlertCircle className="w-3.5 h-3.5" /> Overdue
                  </span>
                ) : invoice.status === "SENT" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Clock className="w-3.5 h-3.5" /> Payment Due
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-neutral-800 text-neutral-400 border border-neutral-700">
                    {invoice.status}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-6 border-y border-neutral-800/60">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-light">Billed To</span>
              <span className="text-base font-normal text-white">{invoice.clientName}</span>
              {invoice.clientCompany && (
                <span className="text-xs text-neutral-400 font-light">{invoice.clientCompany}</span>
              )}
              {invoice.clientEmail && (
                <span className="text-xs text-neutral-400 font-light">{invoice.clientEmail}</span>
              )}
              {invoice.clientPhone && (
                <span className="text-xs text-neutral-400 font-light">{invoice.clientPhone}</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 sm:text-right">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-light">Issue Date</span>
                <span className="text-sm text-neutral-300 font-light">
                  {new Date(invoice.issueDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-light">Due Date</span>
                <span className={`text-sm font-light ${isOverdue ? "text-red-400 font-medium" : "text-neutral-300"}`}>
                  {invoice.dueDate
                    ? new Date(invoice.dueDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Due upon receipt"}
                </span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 text-[10px] uppercase tracking-wider text-neutral-500 font-light">
                    <th className="py-3 px-2">Description</th>
                    <th className="py-3 px-2 text-right">Qty</th>
                    <th className="py-3 px-2 text-right">Price</th>
                    <th className="py-3 px-2 text-right">Tax</th>
                    <th className="py-3 px-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900 text-xs font-light">
                  {invoice.InvoiceItem.map((item: any) => (
                    <tr key={item.id} className="text-neutral-300 hover:bg-neutral-900/30">
                      <td className="py-3.5 px-2 text-white font-normal">{item.description}</td>
                      <td className="py-3.5 px-2 text-right">{Number(item.quantity)}</td>
                      <td className="py-3.5 px-2 text-right">
                        {formatCurrency(Number(item.unitPrice), invoice.currency)}
                      </td>
                      <td className="py-3.5 px-2 text-right text-neutral-400">
                        {Number(item.taxPercent) > 0 ? `${Number(item.taxPercent)}%` : "—"}
                      </td>
                      <td className="py-3.5 px-2 text-right text-white font-medium">
                        {formatCurrency(Number(item.total), invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Breakdown */}
            <div className="flex flex-col sm:items-end mt-6 pt-4 border-t border-neutral-800/80">
              <div className="w-full sm:w-72 flex flex-col gap-2 text-xs font-light">
                <div className="flex justify-between text-neutral-400">
                  <span>Subtotal</span>
                  <span className="text-white">{formatCurrency(Number(invoice.subtotal), invoice.currency)}</span>
                </div>

                {Number(invoice.discount) > 0 && (
                  <div className="flex flex-col gap-0.5">
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount ({Number(invoice.discount)}%)</span>
                      <span>
                        -
                        {formatCurrency(
                          (Number(invoice.subtotal) * Number(invoice.discount)) / 100,
                          invoice.currency
                        )}
                      </span>
                    </div>
                    {invoice.discountRemark && (
                      <span className="text-[11px] text-emerald-500/80 italic text-right">
                        {invoice.discountRemark}
                      </span>
                    )}
                  </div>
                )}

                {Number(invoice.taxTotal) > 0 && (
                  <div className="flex justify-between text-neutral-400">
                    <span>Tax</span>
                    <span className="text-white">{formatCurrency(Number(invoice.taxTotal), invoice.currency)}</span>
                  </div>
                )}

                <div className="flex justify-between items-baseline pt-3 mt-1 border-t border-neutral-800 text-sm">
                  <span className="text-white font-medium">Total Due</span>
                  <span className="text-xl text-white font-semibold">
                    {formatCurrency(Number(invoice.total), invoice.currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment / Bank Wire Details */}
          {bankDetails && Object.keys(bankDetails).length > 0 && (
            <div className="p-6 rounded-2xl bg-neutral-900/40 border border-neutral-800/80 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-xs font-medium text-white">
                <Building className="w-4 h-4 text-neutral-400" />
                Payment &amp; Wire Transfer Details
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-light">
                {bankDetails.bankName && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Bank Name</span>
                    <span className="text-neutral-200">{bankDetails.bankName}</span>
                  </div>
                )}

                {bankDetails.accountHolder && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Account Holder</span>
                    <span className="text-neutral-200">{bankDetails.accountHolder}</span>
                  </div>
                )}

                {bankDetails.accountNumber && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Account Number</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-white">{bankDetails.accountNumber}</span>
                      <button
                        onClick={() => copyToClipboard(bankDetails.accountNumber, "acc")}
                        className="text-neutral-500 hover:text-white transition-colors cursor-pointer"
                        title="Copy Account Number"
                      >
                        {copiedField === "acc" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {bankDetails.ifscSwift && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-neutral-500 uppercase tracking-wider">IFSC / SWIFT</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-white">{bankDetails.ifscSwift}</span>
                      <button
                        onClick={() => copyToClipboard(bankDetails.ifscSwift, "ifsc")}
                        className="text-neutral-500 hover:text-white transition-colors cursor-pointer"
                        title="Copy IFSC / SWIFT"
                      >
                        {copiedField === "ifsc" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {bankDetails.upiId && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-neutral-500 uppercase tracking-wider">UPI ID</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-white">{bankDetails.upiId}</span>
                      <button
                        onClick={() => copyToClipboard(bankDetails.upiId, "upi")}
                        className="text-neutral-500 hover:text-white transition-colors cursor-pointer"
                        title="Copy UPI ID"
                      >
                        {copiedField === "upi" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes & Terms */}
          {(invoice.notes || invoice.terms) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-neutral-800/60 text-xs font-light text-neutral-400">
              {invoice.notes && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-neutral-500">Notes</span>
                  <p className="whitespace-pre-line leading-relaxed">{invoice.notes}</p>
                </div>
              )}
              {invoice.terms && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-neutral-500">Terms &amp; Conditions</span>
                  <p className="whitespace-pre-line leading-relaxed">{invoice.terms}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 py-6 text-xs text-neutral-600 font-light">
          <span>Powered by</span>
          <a href="https://bill.io" target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-white transition-colors">
            Bill.io
          </a>
        </div>
      </div>
    </div>
  );
}
