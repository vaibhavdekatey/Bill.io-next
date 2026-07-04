"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
;
import api from "@/lib/axios";
import PillButton from "@/components/PillButton";

type ProjectItem = {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  total: string;
};

type Invoice = {
  id: string;
  number: string;
  description: string | null;
  status: string;
  currency: string;
  createdAt: string;
  total: string;
};

type ProjectDetailType = {
  id: string;
  name: string;
  description: string;
  currency: string;
  status: "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  quotationId: string | null;
  
  Client?: {
    id: string;
    name: string;
  };
  Quotation?: {
    id: string;
    number: string;
  };
  ProjectItem: ProjectItem[];
  Invoice: Invoice[];
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const [project, setProject] = useState<ProjectDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/projects/${id}`);
      if (res.data.success) {
        setProject(res.data.data);
      } else {
        setError(res.data.error || "Failed to load project details");
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.error || "Network error while loading project.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      setGeneratingInvoice(true);
      setError(null);
      const res = await api.post(`/projects/${id}/invoice`);
      if (res.data.success) {
        router.push(`/invoices/${res.data.data.id}`);
      } else {
        setError(res.data.error || "Failed to generate invoice");
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.error || "Network error while generating invoice.",
      );
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const handleSyncFromQuotation = async () => {
    if (!project?.quotationId) return;
    try {
      setSyncing(true);
      setError(null);
      await api.put(`/projects/${id}/update-from-quotation`);
      fetchProject(); // refresh data
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to sync with quotation.");
    } finally {
      setSyncing(false);
    }
  };

  const handleStatusChange = async (newStatus: ProjectDetailType["status"]) => {
    try {
      setUpdatingStatus(true);
      setError(null);
      const res = await api.put(`/projects/${id}/status`, {
        status: newStatus,
      });
      if (res.data.success) {
        if (project) {
          setProject({ ...project, status: newStatus });
        }
      } else {
        setError(res.data.error || "Failed to update status");
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.error || "Network error while updating status.",
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    try {
      setError(null);
      const res = await api.delete(`/projects/${id}`);
      if (res.data.success) {
        router.push("/projects");
      } else {
        setError(res.data.error || "Failed to delete project");
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.error || "Network error while deleting project.",
      );
    }
  };

  if (loading) {
    return (
      <div className="w-full py-8 px-12 flex flex-col gap-6 animate-pulse">
        <div className="h-10 bg-neutral-900 rounded-xl w-1/3" />
        <div className="h-64 bg-neutral-900 rounded-3xl w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center gap-4 text-white">
        <h1 className="text-2xl font-light">Project not found</h1>
        <p className="text-neutral-500 text-sm">{error}</p>
        <Link href="/projects" className="text-blue-400 hover:underline">
          Back to Projects
        </Link>
      </div>
    );
  }

  const projectTotal = project.ProjectItem.reduce(
    (sum, item) => sum + Number(item.total),
    0,
  );

  return (
    <main className="w-full overflow-y-auto py-8 px-4 md:px-12 print:p-0 print:overflow-visible">
      <div className="flex flex-col w-full max-w-5xl mx-auto gap-8">
        {/* Error State */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/projects")}
              className="p-2 -ml-2 rounded-full hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <div className="flex flex-col">
              <h1 className="text-3xl font-light -tracking-[4%] text-white">
                {project.name}
              </h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-neutral-400">
                <span>
                  Created {new Date(project.createdAt).toLocaleDateString()}
                </span>
                {project.Quotation && (
                  <>
                    <span>•</span>
                    <Link href={`/quotations/${project.Quotation.id}`}
                      className="hover:text-white underline"
                    >
                      From {project.Quotation.number}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4 sm:mt-0">
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-5 py-2.5 rounded-full border border-red-500/20 text-red-400 hover:bg-red-950/20 hover:text-red-300 text-sm font-medium transition-colors cursor-pointer"
            >
              Delete
            </button>
            <div className="flex items-center gap-3">
              {project.quotationId && (
                <button
                  onClick={handleSyncFromQuotation}
                  disabled={syncing}
                  className="px-5 py-2.5 rounded-full border border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-white text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                >
                  {syncing ? "Syncing..." : "Sync with Quotation"}
                </button>
              )}
              <PillButton
                onClickFunction={handleGenerateInvoice}
                title={generatingInvoice ? "Generating..." : "Generate Invoice"}
                arrow={true}
                disabled={generatingInvoice}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-1 md:col-span-2 flex flex-col gap-6">
            {/* Description */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-8 flex flex-col gap-4 shadow-xl">
              <h2 className="text-lg font-medium text-white">Description</h2>
              <p className="text-neutral-400 text-sm whitespace-pre-wrap leading-relaxed">
                {project.description || "No description provided."}
              </p>
            </div>

            {/* Project Deliverables (Items) */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-8 flex flex-col gap-6 shadow-xl">
              <h2 className="text-lg font-medium text-white">Deliverables</h2>
              {project.ProjectItem.length === 0 ? (
                <div className="text-neutral-500 text-sm">
                  No deliverables listed.
                </div>
              ) : (
                <div className="w-full">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-800 text-xs uppercase tracking-widest text-neutral-500">
                        <th className="font-medium pb-4">Description</th>
                        <th className="font-medium pb-4 text-right">Qty</th>
                        <th className="font-medium pb-4 text-right">
                          Unit Price
                        </th>
                        <th className="font-medium pb-4 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/50">
                      {project.ProjectItem.map((item, i) => (
                        <tr key={i} className="text-sm">
                          <td className="py-4 text-neutral-200">
                            {item.description}
                          </td>
                          <td className="py-4 text-right text-neutral-400">
                            {item.quantity}
                          </td>
                          <td className="py-4 text-right text-neutral-400">
                            {formatCurrency(Number(item.unitPrice), project.currency)}
                          </td>
                          <td className="py-4 text-right font-medium text-white">
                            {formatCurrency(Number(item.total), project.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-neutral-800">
                        <td
                          colSpan={3}
                          className="py-4 text-right text-sm text-neutral-400 uppercase tracking-wider"
                        >
                          Project Value
                        </td>
                        <td className="py-4 text-right text-lg font-medium text-white">
                          {formatCurrency(projectTotal, project.currency)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-span-1 flex flex-col gap-6">
            {/* Status Card */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 flex flex-col gap-4 shadow-xl">
              <h3 className="text-xs uppercase tracking-widest text-neutral-500">
                Project Status
              </h3>
              <select
                value={project.status}
                onChange={(e) => handleStatusChange(e.target.value as any)}
                disabled={updatingStatus}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-neutral-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <div className="flex justify-between items-center mt-2">
                <span className="text-white font-medium">
                  {project.status.replace("_", " ")}
                </span>
                {project.Quotation && (
                  <Link href={`/quotations/${project.Quotation.id}`}
                    className="text-xs bg-neutral-800 text-neutral-300 px-2.5 py-1 rounded-full border border-neutral-700 hover:bg-neutral-700 transition-colors"
                  >
                    Quote: {project.Quotation.number}
                  </Link>
                )}
              </div>
            </div>

            {/* Client Card */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 flex flex-col gap-4 shadow-xl">
              <h3 className="text-xs uppercase tracking-widest text-neutral-500">
                Client
              </h3>
              {project.Client ? (
                <div className="flex flex-col gap-1">
                  <span className="text-white font-medium">
                    {project.Client.name}
                  </span>
                  <Link href={`/clients/${project.Client.id}`}
                    className="text-blue-400 text-sm hover:underline"
                  >
                    View Profile
                  </Link>
                </div>
              ) : (
                <span className="text-neutral-500 text-sm">
                  No client assigned
                </span>
              )}
            </div>

            {/* Invoices Card */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 flex flex-col gap-4 shadow-xl">
              <h3 className="text-xs uppercase tracking-widest text-neutral-500">
                Invoices
              </h3>
              {project.Invoice.length === 0 ? (
                <span className="text-neutral-500 text-sm">
                  No invoices generated yet.
                </span>
              ) : (
                <div className="flex flex-col gap-3">
                  {project.Invoice.map((inv) => (
                    <Link key={inv.id}
                      href={`/invoices/${inv.id}`}
                      className="flex items-center justify-between group"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-white text-sm font-medium group-hover:underline">
                          {inv.number}
                        </span>
                        <span className="text-neutral-500 text-xs">
                          {new Date(inv.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="font-medium text-white">
                        {formatCurrency(Number(inv.total), inv.currency || project.currency)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-8 max-w-md w-full flex flex-col gap-6 shadow-2xl">
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-medium text-white">Delete Project</h3>
              <p className="text-neutral-400 text-sm">
                Are you sure you want to delete this project? This action cannot
                be undone. Invoices generated from this project will not be
                deleted, but they will no longer be linked to this project.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 justify-end mt-4">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-5 py-2.5 rounded-full text-white font-medium hover:bg-neutral-800 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white font-medium transition-colors text-sm"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
