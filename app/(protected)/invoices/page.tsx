"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
;
import api from "@/lib/axios";
import PillLink from "@/components/PillLink";

type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "CANCELLED" | "OVERDUE";

type Invoice = {
  id: string;
  number: string;
  status: InvoiceStatus;
  currency: string;
  issueDate: string;
  dueDate: string | null;
  total: number;
  clientName: string;
  clientCompany: string | null;
  Client?: { name: string; companyName: string | null };
  Project?: any;
};

type Pagination = {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

type Stats = {
  totalBilled: number;
  outstanding: number;
  overdue: number;
  avgPaymentDays: number;
  totalCount: number;
};

const STATUS_FILTERS = [
  "All",
  "Paid",
  "Sent",
  "Overdue",
  "Draft",
  "Cancelled",
] as const;

const STATUS_STYLES: Record<string, string> = {
  PAID: "bg-emerald-500/50 text-emerald-100",
  SENT: "bg-blue-500/50 text-blue-100",
  OVERDUE: "bg-red-500/50 text-red-100",
  DRAFT: "bg-neutral-700/50 text-neutral-100",
  CANCELLED: "bg-neutral-800/60 text-neutral-100",
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const isOverdue = (invoice: Invoice) =>
  invoice.status === "SENT" &&
  !!invoice.dueDate &&
  new Date(invoice.dueDate) < new Date();

const Invoices = () => {
  const router = useRouter();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.patch(`/invoices/${id}`, { status });
      setPage(page);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      console.error("Failed to update the status of the invoice", err);
    }
  };

  const openDeleteModal = (id: string) => {
    setDeleteTargetId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      setDeleting(true);
      await api.delete(`/invoices/${deleteTargetId}`);
      setIsDeleteModalOpen(false);
      setDeleteTargetId(null);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      console.error("Failed to delete invoice: ", err);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const res = await api.get("/invoices", {
          params: {
            page,
            limit: 6,
            search: search || undefined,
            InvoiceStatus:
              activeFilter === "All" ? undefined : activeFilter.toUpperCase(),
          },
        });
        setInvoices(res.data.data.invoices);
        setPagination(res.data.data.pagination);
        setStats(res.data.data.stats ?? null);
        console.log(res.data.data);
      } catch (err) {
        console.error("Failed to fetch invoices:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [page, search, activeFilter, refreshKey]);

  return (
    <div>
      <main className="w-full overflow-x-clip py-8 px-4 md:px-12">
        <div className="flex flex-col w-full h-full gap-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center w-full justify-between gap-4">
            <div className="flex flex-col">
              <h1 className="text-4xl font-light -tracking-[4%]">Invoices</h1>
              <p className="text-neutral-400 text-base">
                {pagination?.totalCount ?? 0} invoices · ₹
                {(stats?.totalBilled ?? 0).toLocaleString("en-IN")} billed this
                month
              </p>
            </div>
            <PillLink
              href="/invoices/new"
              hrefTitle="New Invoice"
              arrow={false}
              plus={true}
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Total billed",
                value: `₹${(stats?.totalBilled ?? 0).toLocaleString("en-IN")}`,
              },
              {
                label: "Outstanding",
                value: `₹${(stats?.outstanding ?? 0).toLocaleString("en-IN")}`,
              },
              {
                label: "Overdue",
                value: `₹${(stats?.overdue ?? 0).toLocaleString("en-IN")}`,
                danger: true,
              },
              {
                label: "Avg. payment time",
                value: `${stats?.avgPaymentDays ?? "--"} days`,
              },
            ].map(({ label, value, danger }) => (
              <div
                key={label}
                className="bg-neutral-950 border border-neutral-800 rounded-2xl px-5 py-4"
              >
                <p className="text-xs uppercase tracking-widest text-neutral-500 mb-1">
                  {label}
                </p>
                <p
                  className={`text-2xl font-light tabular-nums ${danger ? "text-red-400" : "text-white"}`}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Filters + Search */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-full p-1 overflow-x-auto w-full md:w-auto scrollbar-hide">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter}
                  onClick={() => {
                    setActiveFilter(filter);
                    setPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-sm transition-all duration-200 cursor-pointer ${
                    activeFilter === filter
                      ? "bg-white text-black font-medium"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search invoices..."
              className="bg-neutral-950 border border-neutral-800 rounded-full px-4 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 w-full md:w-64"
            />
          </div>

          {/* Table */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col w-full">
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-neutral-800">
                  {[
                    "Invoice",
                    "Client",
                    "Issued",
                    "Due",
                    "Status",
                    "Amount",
                    "Actions",
                  ].map((col) => (
                    <th
                      key={col}
                      className={`px-5 py-3.5 text-xs uppercase tracking-widest text-neutral-500 font-medium ${
                        col === "Amount" || col === "Actions"
                          ? "text-right"
                          : "text-left"
                      }`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-800/60">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 bg-neutral-800 rounded animate-pulse w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : invoices.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-16 text-center text-neutral-500 text-sm"
                    >
                      No invoices found
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => {
                    const overdue = isOverdue(invoice);
                    const displayStatus = overdue ? "OVERDUE" : invoice.status;
                    const displayName =
                      invoice.Client?.name ?? invoice.clientName;
                    const displayCompany =
                      invoice.Client?.companyName ?? invoice.clientCompany;
                    const initials = getInitials(displayCompany ?? displayName);

                    return (
                      <tr
                        key={invoice.id}
                        className="hover:bg-neutral-900/40 transition-colors duration-150 cursor-pointer"
                        onClick={() => router.push(`/invoices/${invoice.id}`)}
                      >
                        <td className="px-5 py-4 text-sm font-medium text-white">
                          <div className="flex items-center gap-2">
                            {invoice.number}
                            {invoice.Project && (
                              <span className="bg-indigo-500/10 text-indigo-400 text-[10px] px-2 py-0.5 rounded border border-indigo-500/20 leading-none">
                                PROJ
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-medium text-neutral-300 shrink-0">
                              {initials}
                            </div>
                            <div className="flex flex-col leading-tight">
                              <span className="text-sm text-white">
                                {displayName}
                              </span>
                              {displayCompany && (
                                <span className="text-xs text-neutral-500">
                                  {displayCompany}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-neutral-400">
                          {formatDate(invoice.issueDate)}
                        </td>

                        <td className="px-5 py-4 text-sm">
                          <span
                            className={
                              overdue ? "text-red-400" : "text-neutral-400"
                            }
                          >
                            {invoice.dueDate
                              ? formatDate(invoice.dueDate)
                              : "--"}
                            {overdue && " ⚠"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[displayStatus]}`}
                          >
                            {displayStatus.charAt(0) +
                              displayStatus.slice(1).toLowerCase()}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm font-medium text-white text-right tabular-nums">
                          ₹{Number(invoice.total).toLocaleString("en-IN")}
                        </td>

                        <td
                          className="px-5 py-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-2">
                            {/*<div className="flex items-center justify-end gap-2">*/}
                            {/* Status dropdown */}
                            <select
                              value={invoice.status}
                              onChange={(e) =>
                                handleStatusChange(invoice.id, e.target.value)
                              }
                              className="bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs text-center rounded-full px-2.5 py-1 hover:border-neutral-600 transition-all cursor-pointer focus:outline-none appearance-none"
                            >
                              <option value="DRAFT">Draft</option>
                              <option value="SENT">Sent</option>
                              <option value="PAID">Paid</option>
                              <option value="CANCELLED">Cancelled</option>
                            </select>

                            <button
                              onClick={() =>
                                router.push(`/invoices/${invoice.id}`)
                              }
                              className="text-neutral-500 hover:text-white text-xs border border-neutral-800 px-2.5 py-1 rounded-full hover:border-neutral-600 transition-all cursor-pointer"
                            >
                              View
                            </button>

                            <button
                              onClick={() => openDeleteModal(invoice.id)}
                              className="text-red-400/60 hover:text-red-400 text-xs border border-neutral-800 px-2.5 py-1 rounded-full hover:border-red-500/40 transition-all cursor-pointer"
                            >
                              Delete
                            </button>
                            {/*</div>*/}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            </div>
            {/* Pagination */}
            {pagination && pagination.totalPages > 0 && (
              <div className="px-5 py-4 border-t border-neutral-800 flex items-center justify-between">
                <p className="text-xs text-neutral-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1}–
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.totalCount,
                  )}{" "}
                  of {pagination.totalCount} invoices
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={!pagination.hasPrevPage}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1.5 text-xs flex flex-row gap-x-2 items-center rounded-full border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <svg
                      className="rotate-180"
                      xmlns="http://www.w3.org/2000/svg"
                      width="1.4em"
                      height="1.4em"
                      viewBox="0 0 24 24"
                    >
                      <path d="M0 0h24v24H0z" fill="none" />
                      <path
                        fill="currentColor"
                        d="M4 12h12.25L11 6.75l.66-.75l6.5 6.5l-6.5 6.5l-.66-.75L16.25 13H4z"
                      />
                    </svg>
                    Prev
                  </button>
                  <span className="text-xs text-neutral-500 tabular-nums">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <button
                    disabled={!pagination.hasNextPage}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1.5 text-xs flex flex-row gap-x-2 rounded-full border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    Next{" "}
                    <svg
                      className=""
                      xmlns="http://www.w3.org/2000/svg"
                      width="1.4em"
                      height="1.4em"
                      viewBox="0 0 24 24"
                    >
                      <path d="M0 0h24v24H0z" fill="none" />
                      <path
                        fill="currentColor"
                        d="M4 12h12.25L11 6.75l.66-.75l6.5 6.5l-6.5 6.5l-.66-.75L16.25 13H4z"
                      />
                    </svg>
                  </button>
                </div>
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
                      setDeleteTargetId(null);
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
    </div>
  );
};

export default Invoices;
