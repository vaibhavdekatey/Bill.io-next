"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
;
import api from "@/lib/axios";
import PillButton from "@/components/PillButton";
import { useAuth } from "@/context/AuthContext";
import { pdf } from "@react-pdf/renderer";
import BillPDF from "@/components/BillPDF";
import type { PDFDocumentData } from "@/components/BillPDF";

type QuotationStatus = "DRAFT" | "SENT" | "PAID" | "CANCELLED" | "OVERDUE";

type QuotationItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

type QuotationDetail = {
  id: string;
  number: string;
  status: QuotationStatus;
  currency: string;
  createdAt: string;
  validUntil: string | null;
  subtotal: number;
  taxTotal: number;
  discount: number;
  total: number;
  issuerName: string;
  issuerCompany: string;
  issuerAddress: any;
  clientName: string;
  clientCompany: string | null;
  clientAddress: any;
  QuotationItem: QuotationItem[];
};

const STATUS_STYLES: Record<string, string> = {
  PAID: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  SENT: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  OVERDUE: "bg-red-500/10 text-red-400 border border-red-500/20",
  DRAFT: "bg-neutral-700/40 text-neutral-400 border border-neutral-700",
  CANCELLED: "bg-neutral-800/60 text-neutral-500 border border-neutral-800",
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const formatCurrency = (amount: number, currency: string = "INR") => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

export default function Quotation() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [quotation, setQuotation] = useState<QuotationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { organization } = useAuth();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await api.delete(`/quotations/${id}`);
      router.push("/quotations");
    } catch (err) {
      console.error("Failed to delete quotation", err);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    const fetchQuotationDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/quotations/${id}`);
        setQuotation(res.data.data);
        console.log(res.data.data);
      } catch (err: any) {
        console.error("Failed to fetch Quotation:", err);
        setError(
          err.response?.data?.message || "Failed to load Quotation details",
        );
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchQuotationDetail();
    }
  }, [id]);

  const formatAddress = (addr: any) => {
    if (!addr) return "-";
    if (typeof addr === "string") return addr;
    if (typeof addr === "object") {
      // Handle old format
      if (addr.full) return addr.full;
      if (addr.address) return addr.address;

      const lines = [addr.line1, addr.line2, addr.line3].filter(Boolean);
      const cityStateZip = [addr.city, addr.state, addr.pincode]
        .filter(Boolean)
        .join(", ");
      if (cityStateZip) lines.push(cityStateZip);

      return lines.join("\n");
    }
    return "-";
  };

  const parsedClientAddress = useMemo(() => {
    return formatAddress(quotation?.clientAddress); // or quotation?.clientAddress
  }, [quotation?.clientAddress]);

  const pdfData: PDFDocumentData | null = quotation
    ? {
        type: "QUOTATION",
        number: quotation.number,
        status: quotation.status,
        currency: quotation.currency,
        issueDate: quotation.createdAt,
        validUntil: quotation.validUntil,
        subtotal: quotation.subtotal,
        taxTotal: quotation.taxTotal,
        discount: quotation.discount,
        total: quotation.total,
        issuerName: quotation.issuerName,
        issuerCompany: quotation.issuerCompany,
        issuerAddress: quotation.issuerAddress,
        clientName: quotation.clientName,
        clientCompany: quotation.clientCompany,
        clientAddress: quotation.clientAddress,
        items: quotation.QuotationItem,
        logoUrl:
          organization?.Organization?.logoUrl || (organization as any)?.logoUrl,
        organizationName:
          organization?.Organization?.name || (organization as any)?.name,
      }
    : null;

  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [converting, setConverting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleConvertToProject = async () => {
    try {
      setConverting(true);
      setError(null);
      const res = await api.post(`/projects/from-quotation/${id}`);
      if (res.data.success) {
        router.push(`/projects/${res.data.data.id}`);
      } else {
        setError(res.data.error || "Failed to convert quotation");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to convert quotation");
    } finally {
      setConverting(false);
    }
  };

  const handleSyncProject = async (projectId: string) => {
    try {
      setSyncing(true);
      setError(null);
      await api.put(`/projects/${projectId}/update-from-quotation`);
      // No navigation needed, maybe a success toast in a real app, but for now we just finish.
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to sync project");
    } finally {
      setSyncing(false);
    }
  };

  const handleViewPDF = async () => {
    if (!pdfData) return;
    try {
      setGeneratingPdf(true);

      // Pre-fetch logo as base64 to avoid React-PDF fetching issues
      let resolvedLogo = pdfData.logoUrl;
      if (
        resolvedLogo &&
        !resolvedLogo.startsWith("http") &&
        !resolvedLogo.startsWith("data:")
      ) {
        resolvedLogo = `http://localhost:3000${resolvedLogo}`;
      }

      if (resolvedLogo && resolvedLogo.startsWith("http")) {
        try {
          const response = await fetch(resolvedLogo);
          const blob = await response.blob();
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          pdfData.logoUrl = base64;
        } catch (e) {
          console.error("Failed to pre-fetch logo:", e);
        }
      }

      const blob = await pdf(<BillPDF data={pdfData} />).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err) {
      console.error("Failed to generate PDF:", err);
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full py-8 px-12 flex flex-col gap-6 animate-pulse">
        <div className="h-10 bg-neutral-800 rounded w-1/4" />
        <div className="h-[500px] bg-neutral-900 border border-neutral-800 rounded-2xl" />
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="w-full py-16 px-12 flex flex-col items-center justify-center gap-4">
        <div className="text-red-400 text-lg font-light">
          {error || "Quotation not found"}
        </div>
        <Link href={"/quotations"}
          // onClick={() => router.push("/quotations")}
          className="text-neutral-400 hover:text-white underline text-sm transition-colors"
        >
          Back to Quotations
        </Link>
      </div>
    );
  }

  const isOverdue =
    quotation.status === "SENT" &&
    quotation.validUntil &&
    new Date(quotation.validUntil) < new Date();
  const displayStatus = isOverdue ? "OVERDUE" : quotation.status;

  return (
    <main className="w-full overflow-y-auto py-8 px-4 md:px-12">
      <div className="flex flex-col w-full max-w-4xl mx-auto gap-8">
        {/* Navigation & Header Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
          <Link href={"/quotations"}
            // onClick={() => router.push("/quotations")}
            className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Quotations
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => router.push(`/quotations/new?edit=${quotation.id}`)}
              className="text-neutral-300 hover:text-white text-sm border border-neutral-800 px-5 py-2.5 rounded-full hover:border-neutral-600 transition-all cursor-pointer font-medium flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
              Edit
            </button>
            {(quotation as any).Project && (quotation as any).Project.length > 0 ? (
              <>
                <button
                  onClick={() => handleSyncProject((quotation as any).Project[0].id)}
                  disabled={syncing}
                  className="px-5 py-2.5 rounded-full border border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-white text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                >
                  {syncing ? "Syncing..." : "Sync Project"}
                </button>
                <button
                  onClick={() =>
                    router.push(`/projects/${(quotation as any).Project[0].id}`)
                  }
                  className="text-indigo-400 hover:text-indigo-300 text-sm border border-indigo-500/30 bg-indigo-500/10 px-5 py-2.5 rounded-full hover:border-indigo-500/50 transition-all cursor-pointer font-medium"
                >
                  View Project
                </button>
              </>
            ) : (
              <button
                onClick={handleConvertToProject}
                disabled={converting}
                className="text-neutral-300 hover:text-white text-sm border border-neutral-800 px-5 py-2.5 rounded-full hover:border-neutral-600 transition-all cursor-pointer font-medium disabled:opacity-50"
              >
                {converting ? "Converting..." : "Convert to Project"}
              </button>
            )}
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-5 py-2.5 rounded-full border border-red-500/20 text-red-400 hover:bg-red-950/20 hover:text-red-300 text-sm font-medium transition-colors cursor-pointer"
            >
              Delete
            </button>

            {pdfData && (
              <button
                onClick={handleViewPDF}
                disabled={generatingPdf}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                {generatingPdf ? "Generating..." : "Print / View PDF"}
              </button>
            )}
          </div>
        </div>

        {/* Quotation Page Card */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-12 flex flex-col gap-10 shadow-2xl print:border-0 print:bg-white print:text-black print:p-0">
          {/* Top block: Quotation number and status */}
          <div className="flex justify-between items-start border-b border-neutral-800 pb-8 print:border-neutral-200">
            <div className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-widest text-neutral-500 print:text-neutral-600">
                Quotation Number
              </span>
              <h1 className="text-3xl font-light text-white print:text-black">
                {quotation.number}
              </h1>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="text-xs uppercase tracking-widest text-neutral-500 print:text-neutral-600">
                Status
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${STATUS_STYLES[displayStatus]}`}
              >
                {displayStatus}
              </span>
            </div>
          </div>

          {/* Sender and Recipient Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-neutral-800 pb-8 print:border-neutral-200">
            {/* Issuer (From) */}
            <div className="flex flex-col gap-3">
              <span className="text-xs uppercase tracking-widest text-neutral-500 print:text-neutral-600">
                From
              </span>
              <div className="flex flex-col">
                <span className="text-lg font-medium text-white print:text-black">
                  {quotation.issuerCompany || quotation.issuerName}
                </span>
                {quotation.issuerCompany &&
                  quotation.issuerName !== quotation.issuerCompany && (
                    <span className="text-sm text-neutral-400 print:text-neutral-700">
                      {quotation.issuerName}
                    </span>
                  )}
                {quotation.issuerAddress.address.length > 0 && (
                  <span className="text-sm text-neutral-400 mt-1 whitespace-pre-line print:text-neutral-700">
                    {quotation.issuerAddress.address}
                  </span>
                )}
              </div>
            </div>

            {/* Client (To) */}
            <div className="flex flex-col gap-3">
              <span className="text-xs uppercase tracking-widest text-neutral-500 print:text-neutral-600">
                Billed To
              </span>
              <div className="flex flex-col">
                <span className="text-lg font-medium text-white print:text-black">
                  {quotation.clientName}
                </span>
                {quotation.clientCompany && (
                  <span className="text-sm text-neutral-400 print:text-neutral-700">
                    {quotation.clientCompany}
                  </span>
                )}
                {parsedClientAddress && (
                  <span className="text-sm text-neutral-400 mt-1 whitespace-pre-line print:text-neutral-700">
                    {parsedClientAddress}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 bg-neutral-900/40 border border-neutral-800/80 rounded-2xl px-6 py-5 print:bg-neutral-50 print:border-neutral-200 print:text-black">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 print:text-neutral-600">
                Issue Date
              </span>
              <span className="text-sm font-medium text-white mt-1 print:text-black">
                {formatDate(quotation.createdAt)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 print:text-neutral-600">
                Valid Until
              </span>
              <span
                className={`text-sm font-medium mt-1 ${isOverdue ? "text-red-400 print:text-red-600 font-semibold" : "text-white print:text-black"}`}
              >
                {quotation.validUntil ? formatDate(quotation.validUntil) : "—"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 print:text-neutral-600">
                Currency
              </span>
              <span className="text-sm font-medium text-white mt-1 print:text-black">
                {quotation.currency}
              </span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="flex flex-col gap-3">
            <span className="text-xs uppercase tracking-widest text-neutral-500 print:text-neutral-600">
              Line Items
            </span>
            <div className="overflow-x-auto border border-neutral-800 rounded-2xl print:border-neutral-200">
              <table className="w-full min-w-[600px] text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-900/60 border-b border-neutral-800 print:bg-neutral-50 print:border-neutral-200">
                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-neutral-400 print:text-neutral-600 font-medium">
                      Description
                    </th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-neutral-400 print:text-neutral-600 font-medium text-right">
                      Qty
                    </th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-neutral-400 print:text-neutral-600 font-medium text-right">
                      Unit Price
                    </th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-neutral-400 print:text-neutral-600 font-medium text-right">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 print:divide-neutral-200">
                  {quotation.QuotationItem.map((item) => (
                    <tr key={item.id} className="text-sm print:text-black">
                      <td className="px-6 py-4 font-light text-white print:text-black">
                        {item.description}
                      </td>
                      <td className="px-6 py-4 text-right text-neutral-300 print:text-black tabular-nums">
                        {Number(item.quantity)}
                      </td>
                      <td className="px-6 py-4 text-right text-neutral-300 print:text-black tabular-nums">
                        {formatCurrency(
                          Number(item.unitPrice),
                          quotation.currency,
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-white font-medium print:text-black tabular-nums">
                        {formatCurrency(Number(item.total), quotation.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Calculations Summary */}
          <div className="flex flex-col items-end gap-3 border-t border-neutral-800 pt-8 print:border-neutral-200">
            <div className="w-80 flex flex-col gap-3">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400 print:text-neutral-600">
                  Subtotal
                </span>
                <span className="text-white print:text-black tabular-nums font-light">
                  {formatCurrency(
                    Number(quotation.subtotal),
                    quotation.currency,
                  )}
                </span>
              </div>

              {Number(quotation.discount) > 0 && (
                <div className="flex justify-between text-sm text-emerald-400">
                  <span>Discount ({Number(quotation.discount)}%)</span>
                  <span className="tabular-nums font-light">
                    -
                    {formatCurrency(
                      (Number(quotation.subtotal) *
                        Number(quotation.discount)) /
                        100,
                      quotation.currency,
                    )}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-neutral-400 print:text-neutral-600">
                  Tax Total
                </span>
                <span className="text-white print:text-black tabular-nums font-light">
                  {formatCurrency(
                    Number(quotation.taxTotal),
                    quotation.currency,
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center border-t border-neutral-800 pt-4 mt-2 print:border-neutral-200">
                <span className="text-base font-medium text-white print:text-black">
                  Total Due
                </span>
                <span className="text-3xl font-light text-white print:text-black tabular-nums">
                  {formatCurrency(Number(quotation.total), quotation.currency)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="bg-neutral-950 border border-neutral-800 rounded-3xl w-full max-w-sm p-8 flex flex-col items-center text-center gap-6 shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-4xl font-light text-white">
                  Delete Quotation?
                </h3>
                <p className="text-sm text-neutral-400">
                  This will permanently delete the Quotation and all it's line
                  items.
                </p>
              </div>
              <div className="flex w-full gap-3 mt-2">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                  }}
                  className="flex-1 px-5 py-3 cursor-pointer rounded-full border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 text-sm font-light transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-5 py-3 cursor-pointer rounded-full bg-red-700 hover:bg-red-500 disabled:bg-neutral-900 disabled:text-neutral-500 text-white text-sm font-light transition-colors"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
