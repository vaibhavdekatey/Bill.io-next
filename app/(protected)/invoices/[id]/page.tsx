"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
;
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { pdf } from "@react-pdf/renderer";
import BillPDF from "@/components/BillPDF";
import type { PDFDocumentData } from "@/components/BillPDF";
import PillButton from "@/components/PillButton";

type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "CANCELLED" | "OVERDUE";

type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

type InvoiceDetail = {
  id: string;
  number: string;
  status: InvoiceStatus;
  currency: string;
  issueDate: string;
  dueDate: string | null;
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
  InvoiceItem: InvoiceItem[];
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

export default function Invoice() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { organization } = useAuth();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    try {
      setDeleting(true);
      await api.delete(`/invoices/${id}`);
      router.push("/invoices");
    } catch (err) {
      console.error("Failed to delete invoice:", err);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    const fetchInvoiceDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/invoices/${id}`);
        setInvoice(res.data.data);
      } catch (err: any) {
        console.error("Failed to fetch invoice:", err);
        setError(
          err.response?.data?.message || "Failed to load invoice details",
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchInvoiceDetail();
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
    return formatAddress(invoice?.clientAddress); // or quotation?.clientAddress
  }, [invoice?.clientAddress]);

  const pdfData: PDFDocumentData | null = invoice
    ? {
        type: "INVOICE",
        number: invoice.number,
        status: invoice.status,
        currency: invoice.currency,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        subtotal: invoice.subtotal,
        taxTotal: invoice.taxTotal,
        discount: invoice.discount,
        total: invoice.total,
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
        items: invoice.InvoiceItem,
        logoUrl:
          organization?.Organization?.logoUrl || (organization as any)?.logoUrl,
        organizationName:
          organization?.Organization?.name || (organization as any)?.name,
      }
    : null;

  const [generatingPdf, setGeneratingPdf] = useState(false);
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

  if (error || !invoice) {
    return (
      <div className="w-full py-16 px-12 flex flex-col items-center justify-center gap-4">
        <div className="text-red-400 text-lg font-light">
          {error || "Invoice not found"}
        </div>
        <button
          onClick={() => router.push("/invoices")}
          className="text-neutral-400 hover:text-white underline text-sm transition-colors"
        >
          Back to Invoices
        </button>
      </div>
    );
  }

  const isOverdue =
    invoice.status === "SENT" &&
    invoice.dueDate &&
    new Date(invoice.dueDate) < new Date();
  const displayStatus = isOverdue ? "OVERDUE" : invoice.status;

  const parsedIssuerAddress =
    typeof invoice.issuerAddress === "string"
      ? invoice.issuerAddress
      : typeof invoice.issuerAddress === "object" &&
          invoice.issuerAddress !== null
        ? (invoice.issuerAddress as any).address ||
          JSON.stringify(invoice.issuerAddress)
        : "";

  return (
    <main className="w-full overflow-y-auto py-8 px-4 md:px-12">
      <div className="flex flex-col w-full max-w-4xl mx-auto gap-8">
        {/* Navigation & Header Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
          <Link href={"/invoices"}
            // onClick={() => router.push("/invoices")}
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
            Back to Invoices
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            {/* Edit Button navigating to form with edit param */}
            <button
              onClick={() => router.push(`/invoices/new?edit=${invoice.id}`)}
              className="text-neutral-300 hover:text-white text-sm border border-neutral-800 px-5 py-2.5 rounded-full hover:border-neutral-600 transition-all cursor-pointer font-medium flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
              Edit
            </button>

            {(invoice as any).Project && (
              <button
                onClick={() => router.push(`/projects/${(invoice as any).Project.id}`)}
                className="text-indigo-400 hover:text-indigo-300 text-sm border border-indigo-500/30 bg-indigo-500/10 px-5 py-2.5 rounded-full hover:border-indigo-500/50 transition-all cursor-pointer font-medium"
              >
                View Project
              </button>
            )}

            {/* Delete Button triggering confirmation modal */}
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

        {/* Invoice Page Card */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-12 flex flex-col gap-10 shadow-2xl print:border-0 print:bg-white print:text-black print:p-0">
          {/* Top block: Invoice number and status */}
          <div className="flex justify-between items-start border-b border-neutral-800 pb-8 print:border-neutral-200">
            <div className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-widest text-neutral-500 print:text-neutral-600">
                Invoice Number
              </span>
              <h1 className="text-3xl font-light text-white print:text-black">
                {invoice.number}
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
                  {invoice.issuerCompany || invoice.issuerName}
                </span>
                {invoice.issuerCompany &&
                  invoice.issuerName !== invoice.issuerCompany && (
                    <span className="text-sm text-neutral-400 print:text-neutral-700">
                      {invoice.issuerName}
                    </span>
                  )}
                {parsedIssuerAddress && (
                  <span className="text-sm text-neutral-400 mt-1 whitespace-pre-line print:text-neutral-700">
                    {parsedIssuerAddress}
                  </span>
                )}
                {invoice.issuerEmail && invoice.issuerEmail !== "Email not set" && (
                  <span className="text-sm text-neutral-400 mt-1 print:text-neutral-700">
                    {invoice.issuerEmail}
                  </span>
                )}
                {invoice.issuerPhone && invoice.issuerPhone !== "Phone not set" && (
                  <span className="text-sm text-neutral-400 print:text-neutral-700">
                    {invoice.issuerPhone}
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
                  {invoice.clientName}
                </span>
                {invoice.clientCompany && (
                  <span className="text-sm text-neutral-400 print:text-neutral-700">
                    {invoice.clientCompany}
                  </span>
                )}
                {parsedClientAddress && (
                  <span className="text-sm text-neutral-400 mt-1 whitespace-pre-line print:text-neutral-700">
                    {parsedClientAddress}
                  </span>
                )}
                {invoice.clientEmail && invoice.clientEmail !== "Email not set" && (
                  <span className="text-sm text-neutral-400 mt-1 print:text-neutral-700">
                    {invoice.clientEmail}
                  </span>
                )}
                {invoice.clientPhone && invoice.clientPhone !== "Phone not set" && (
                  <span className="text-sm text-neutral-400 print:text-neutral-700">
                    {invoice.clientPhone}
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
                {formatDate(invoice.issueDate)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 print:text-neutral-600">
                Due Date
              </span>
              <span
                className={`text-sm font-medium mt-1 ${isOverdue ? "text-red-400 print:text-red-600 font-semibold" : "text-white print:text-black"}`}
              >
                {invoice.dueDate ? formatDate(invoice.dueDate) : "—"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 print:text-neutral-600">
                Currency
              </span>
              <span className="text-sm font-medium text-white mt-1 print:text-black">
                {invoice.currency}
              </span>
            </div>
          </div>

          {/* Line Items Table */}
          {/*<div className="flex flex-col gap-3">
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
                  {invoice.InvoiceItem.map((item) => (
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
                          invoice.currency,
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-white font-medium print:text-black tabular-nums">
                        {formatCurrency(Number(item.total), invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>*/}
          {/* Line Items Table */}
          <div className="flex flex-col gap-3 mt-4">
            <span className="text-xs uppercase tracking-widest text-neutral-500 print:text-black print:font-bold">
              Line Items
            </span>
            <div className="overflow-x-auto border border-neutral-800 rounded-2xl print:border-neutral-400 print:rounded-none">
              <table className="w-full text-left border-collapse print:border-hidden">
                <thead>
                  <tr className="bg-neutral-900/60 border-b border-neutral-800 print:bg-transparent print:border-b-2 print:border-neutral-500">
                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-neutral-400 font-medium print:text-black print:border-r print:border-neutral-300 print:px-4 print:py-3 print:font-bold">
                      Description
                    </th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-neutral-400 font-medium text-right print:text-black print:border-r print:border-neutral-300 print:px-4 print:py-3 print:font-bold">
                      Qty
                    </th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-neutral-400 font-medium text-right print:text-black print:border-r print:border-neutral-300 print:px-4 print:py-3 print:font-bold">
                      Unit Price
                    </th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-neutral-400 font-medium text-right print:text-black print:px-4 print:py-3 print:font-bold">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 print:divide-y print:divide-neutral-300">
                  {invoice.InvoiceItem.map((item) => (
                    <tr key={item.id} className="text-sm print:text-black">
                      <td className="px-6 py-4 font-light text-white print:text-black print:border-r print:border-neutral-300 print:px-4 print:py-2">
                        {item.description}
                      </td>
                      <td className="px-6 py-4 text-right text-neutral-300 tabular-nums print:text-black print:border-r print:border-neutral-300 print:px-4 print:py-2">
                        {Number(item.quantity)}
                      </td>
                      <td className="px-6 py-4 text-right text-neutral-300 tabular-nums print:text-black print:border-r print:border-neutral-300 print:px-4 print:py-2">
                        {formatCurrency(
                          Number(item.unitPrice),
                          invoice.currency,
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-white font-medium tabular-nums print:text-black print:px-4 print:py-2">
                        {formatCurrency(Number(item.total), invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Calculations Summary and Notes */}
          <div className="flex flex-col md:flex-row justify-between gap-8 border-t border-neutral-800 pt-8 print:border-neutral-200 print:flex-row">
            <div className="flex-1 flex flex-col gap-6">
              {invoice.notes && (
                <div className="flex flex-col gap-2 p-5 bg-neutral-900/50 border border-neutral-800 rounded-2xl print:bg-neutral-50 print:border-neutral-200 print:rounded-xl">
                  <span className="text-xs uppercase tracking-widest text-neutral-500 print:text-black print:font-bold">
                    Client Note
                  </span>
                  <span className="text-sm text-neutral-300 whitespace-pre-wrap print:text-neutral-700">
                    {invoice.notes}
                  </span>
                </div>
              )}
              {invoice.terms && (
                <div className="flex flex-col gap-2 p-5 bg-neutral-900/50 border border-neutral-800 rounded-2xl print:bg-neutral-50 print:border-neutral-200 print:rounded-xl">
                  <span className="text-xs uppercase tracking-widest text-neutral-500 print:text-black print:font-bold">
                    Payment Terms
                  </span>
                  <span className="text-sm text-neutral-300 whitespace-pre-wrap print:text-neutral-700">
                    {invoice.terms}
                  </span>
                </div>
              )}
            </div>

            <div className="w-full md:w-80 flex flex-col gap-3 print:w-80">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400 print:text-neutral-600">
                  Subtotal
                </span>
                <span className="text-white print:text-black tabular-nums font-light">
                  {formatCurrency(Number(invoice.subtotal), invoice.currency)}
                </span>
              </div>

              {Number(invoice.discount) > 0 && (
                <div className="flex justify-between text-sm text-emerald-400">
                  <span>Discount ({Number(invoice.discount)}%)</span>
                  <span className="tabular-nums font-light">
                    -
                    {formatCurrency(
                      (Number(invoice.subtotal) * Number(invoice.discount)) /
                        100,
                      invoice.currency,
                    )}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-neutral-400 print:text-neutral-600">
                  Tax Total
                </span>
                <span className="text-white print:text-black tabular-nums font-light">
                  {formatCurrency(Number(invoice.taxTotal), invoice.currency)}
                </span>
              </div>

              <div className="flex justify-between items-center border-t border-neutral-800 pt-4 mt-2 print:border-neutral-200">
                <span className="text-base font-medium text-white print:text-black">
                  Total Due
                </span>
                <span className="text-3xl font-light text-white print:text-black tabular-nums">
                  {formatCurrency(Number(invoice.total), invoice.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer details */}
          {invoice.issuerWebsite && (
            <div className="flex flex-row justify-center items-center gap-4 border-t border-neutral-800 pt-8 mt-4 text-xs text-neutral-500 print:border-neutral-200 print:text-neutral-500">
              <span>{invoice.issuerWebsite}</span>
            </div>
          )}
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
                  Delete Invoice?
                </h3>
                <p className="text-sm text-neutral-400">
                  This will permanently delete the invoice and all its line
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
