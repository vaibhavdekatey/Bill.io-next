"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
;
import api from "@/lib/axios";
import PillButton from "@/components/PillButton";

type ClientDetailType = {
  id: string;
  name: string;
  companyName: string | null;
  email: string | null;
  taxId: string | null;
  address: any;
  createdAt: string;
  Project?: any[];
  Invoice?: any[];
  Quotation?: any[];
};

type ClientFormState = {
  name: string;
  companyName: string;
  email: string;
  taxId: string;
  address: {
    line1: string;
    line2: string;
    line3: string;
    city: string;
    state: string;
    pincode: string;
  };
};

export default function ClientDetail() {
  const router = useRouter();

  const { id } = useParams<{ id: string }>();

  const [client, setClient] = useState<ClientDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editingClient, setEditingClient] = useState<ClientDetailType | null>(
    null,
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [form, setForm] = useState<ClientFormState>({
    name: "",
    companyName: "",
    email: "",
    taxId: "",
    address: {
      line1: "",
      line2: "",
      line3: "",
      city: "",
      state: "",
      pincode: "",
    },
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const openEditModal = (client: ClientDetailType) => {
    setEditingClient(client);

    const addrObj =
      typeof client.address === "object" && client.address !== null
        ? client.address
        : {};

    setForm({
      name: client.name,
      companyName: client.companyName || "",
      email: client.email || "",
      taxId: client.taxId || "",
      address: {
        line1:
          addrObj.line1 ||
          addrObj.address ||
          addrObj.full ||
          (typeof client.address === "string" ? client.address : ""),
        line2: addrObj.line2 || "",
        line3: addrObj.line3 || "",
        city: addrObj.city || "",
        state: addrObj.state || "",
        pincode: addrObj.pincode || "",
      },
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const openDeleteModal = (id: string) => {
    setClientToDelete(id);
    setIsDeleteModalOpen(true);
  };
  // Performs the actual deletion
  const handleDelete = async () => {
    if (!clientToDelete) return;
    try {
      setSubmitting(true);
      await api.delete(`/clients/${clientToDelete}`);
      setIsDeleteModalOpen(false);
      setClientToDelete(null);
      router.push("/clients");
    } catch (err) {
      console.error("Failed to delete client:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.name.trim()) {
      setFormError("Client name is required");
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        name: form.name.trim(),
        companyName: form.companyName.trim() || undefined,
        email: form.email.trim() || undefined,
        taxId: form.taxId.trim() || undefined,
        address: form.address,
      };
      if (editingClient) {
        await api.put(`/clients/${editingClient.id}`, payload);
      } else {
        await api.post("/clients", payload);
      }
      setIsModalOpen(false);
      fetchClient();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  useEffect(() => {
    fetchClient();
  }, [id]);

  const fetchClient = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/clients/${id}`);
      if (res.data.success) {
        setClient(res.data.data);
      } else {
        setError(res.data.error || "Failed to load client details");
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.error || "Network error while loading client.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-neutral-400 font-mono text-sm animate-pulse">
        Loading client...
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="p-8 text-red-400 font-mono text-sm">
        {error || "Client not found"}
        <div className="mt-4">
          <Link href="/clients" className="text-white underline">
            Back to Clients
          </Link>
        </div>
      </div>
    );
  }

  const initials = client.name
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const totalInvoiced = client.Invoice?.reduce(
    (sum: any, inv: any) => sum + Number(inv.total),
    0,
  );

  return (
    <div className="max-w-5xl mx-auto pb-24 mt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <Link href="/clients"
          className="text-neutral-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Clients
        </Link>
        <div className="flex flex-wrap justify-start sm:justify-end gap-3">
          <PillButton
            onClickFunction={() => openEditModal(client)}
            disabled={false}
            title={
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                Edit
              </>
            }
            arrow={false}
          />

          <PillButton
            onClickFunction={() => openDeleteModal(client.id)}
            disabled={false}
            title="Delete"
            arrow={false}
            className="text-red-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Client Info Header */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-8 flex items-center gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64  rounded-full pointer-events-none" />
            <div className="w-20 h-20 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center text-2xl font-semibold text-white shrink-0 ">
              {initials}
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-white mb-2">
                {client.name}
              </h1>
              <p className="text-neutral-400 font-medium">
                {client.companyName || "Independent Client"}
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5">
              <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">
                Total Projects
              </p>
              <p className="text-2xl text-white font-light tabular-nums">
                {client.Project?.length}
              </p>
            </div>
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5">
              <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">
                Total Invoices
              </p>
              <p className="text-2xl text-white font-light tabular-nums">
                {client.Invoice?.length}
              </p>
            </div>
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5">
              <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">
                Value Invoiced
              </p>
              <p className="text-2xl text-white font-light tabular-nums">
                {formatCurrency(
                  totalInvoiced,
                  client.Invoice?.[0]?.currency || "USD",
                )}
              </p>
            </div>
          </div>

          {/* Projects */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl overflow-hidden">
            <div className="px-6 py-5 border-b border-neutral-800">
              <h2 className="text-lg font-medium text-white">Projects</h2>
            </div>
            {client.Project?.length === 0 ? (
              <div className="p-8 text-center text-sm text-neutral-500">
                No projects linked yet.
              </div>
            ) : (
              <div className="divide-y divide-neutral-800/60">
                {client.Project?.map((proj) => (
                  <Link key={proj.id}
                    href={`/projects/${proj.id}`}
                    className="flex items-center justify-between p-6 hover:bg-neutral-900/50 transition-colors"
                  >
                    <div>
                      <p className="text-white font-medium mb-1">{proj.name}</p>
                      <p className="text-xs text-neutral-500">
                        {new Date(proj.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-800 text-neutral-300">
                      {proj.status.replace("_", " ")}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Invoices */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl overflow-hidden">
            <div className="px-6 py-5 border-b border-neutral-800">
              <h2 className="text-lg font-medium text-white">Invoices</h2>
            </div>
            {client.Invoice?.length === 0 ? (
              <div className="p-8 text-center text-sm text-neutral-500">
                No invoices generated yet.
              </div>
            ) : (
              <div className="divide-y divide-neutral-800/60">
                {client.Invoice?.map((inv) => (
                  <Link key={inv.id}
                    href={`/invoices/${inv.id}`}
                    className="flex items-center justify-between p-6 hover:bg-neutral-900/50 transition-colors"
                  >
                    <div>
                      <p className="text-white font-medium mb-1">
                        {inv.number}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-800 text-neutral-300">
                        {inv.status}
                      </span>
                      <span className="text-white font-medium tabular-nums">
                        {formatCurrency(Number(inv.total), inv.currency)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quotations */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl overflow-hidden">
            <div className="px-6 py-5 border-b border-neutral-800">
              <h2 className="text-lg font-medium text-white">Quotations</h2>
            </div>
            {client.Quotation?.length === 0 ? (
              <div className="p-8 text-center text-sm text-neutral-500">
                No quotations created yet.
              </div>
            ) : (
              <div className="divide-y divide-neutral-800/60">
                {client.Quotation?.map((quote) => (
                  <Link key={quote.id}
                    href={`/quotations/${quote.id}`}
                    className="flex items-center justify-between p-6 hover:bg-neutral-900/50 transition-colors"
                  >
                    <div>
                      <p className="text-white font-medium mb-1">
                        {quote.number}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {new Date(quote.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-800 text-neutral-300">
                        {quote.status}
                      </span>
                      <span className="text-white font-medium tabular-nums">
                        {formatCurrency(Number(quote.total), quote.currency)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6">
            <h3 className="text-sm font-medium text-white mb-4">
              Client Details
            </h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-xs text-neutral-500 mb-1 uppercase tracking-wider">
                  Email
                </dt>
                <dd className="text-sm text-neutral-300">
                  {client.email || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500 mb-1 uppercase tracking-wider">
                  Tax ID
                </dt>
                <dd className="text-sm text-neutral-300">
                  {client.taxId || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500 mb-1 uppercase tracking-wider">
                  Address
                </dt>
                <dd className="text-sm text-neutral-300">
                  {client.address && typeof client.address === "object" ? (
                    <>
                      {client.address.line1 && (
                        <div>{client.address.line1}</div>
                      )}
                      {client.address.line2 && (
                        <div>{client.address.line2}</div>
                      )}
                      {client.address.line3 && (
                        <div>{client.address.line3}</div>
                      )}
                      <div>
                        {[
                          client.address.city,
                          client.address.state,
                          client.address.pincode,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    </>
                  ) : typeof client.address === "string" ? (
                    client.address
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Modal Overlay */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-neutral-950 border border-neutral-800/40 rounded-3xl w-full max-w-lg p-8 flex flex-col gap-6 shadow-2xl animate-in fade-in zoom-in-95 duration-250">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
                <h3 className="text-4xl font-light text-white">
                  {editingClient ? "Edit Client" : "New Client"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              {formError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
                  {formError}
                </div>
              )}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase tracking-wider text-neutral-400 font-medium">
                    Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Priyesh Shah"
                    className="bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-neutral-600 rounded-xl px-4 py-3 text-sm transition-colors"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase tracking-wider text-neutral-400 font-medium">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={(e) =>
                      setForm({ ...form, companyName: e.target.value })
                    }
                    placeholder="e.g. Acme Labs"
                    className="bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-neutral-600 rounded-xl px-4 py-3 text-sm transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase tracking-wider text-neutral-400 font-medium">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="e.g. priyesh@acme.com"
                    className="bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-neutral-600 rounded-xl px-4 py-3 text-sm transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase tracking-wider text-neutral-400 font-medium">
                    Tax ID / GSTIN
                  </label>
                  <input
                    type="text"
                    value={form.taxId}
                    onChange={(e) =>
                      setForm({ ...form, taxId: e.target.value })
                    }
                    placeholder="e.g. 27ABCDE1234F1Z5"
                    className="bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-neutral-600 rounded-xl px-4 py-3 text-sm transition-colors"
                  />
                </div>
                {/* Address Section */}
                <div className="flex flex-col gap-3">
                  <label className="text-xs uppercase tracking-wider text-neutral-400 font-medium">
                    Billing Address
                  </label>
                  <input
                    type="text"
                    value={form.address.line1}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        address: { ...form.address, line1: e.target.value },
                      })
                    }
                    placeholder="Address Line 1 (Street, House No.)"
                    className="bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-neutral-600 rounded-xl px-4 py-3 text-sm transition-colors"
                  />
                  <input
                    type="text"
                    value={form.address.line2}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        address: { ...form.address, line2: e.target.value },
                      })
                    }
                    placeholder="Address Line 2 (Apartment, Suite, Unit)"
                    className="bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-neutral-600 rounded-xl px-4 py-3 text-sm transition-colors"
                  />
                  <input
                    type="text"
                    value={form.address.line3}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        address: { ...form.address, line3: e.target.value },
                      })
                    }
                    placeholder="Address Line 3 (Landmark, Area)"
                    className="bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-neutral-600 rounded-xl px-4 py-3 text-sm transition-colors"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={form.address.city}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          address: { ...form.address, city: e.target.value },
                        })
                      }
                      placeholder="City"
                      className="bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-neutral-600 rounded-xl px-4 py-3 text-sm transition-colors"
                    />
                    <input
                      type="text"
                      value={form.address.state}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          address: { ...form.address, state: e.target.value },
                        })
                      }
                      placeholder="State"
                      className="bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-neutral-600 rounded-xl px-4 py-3 text-sm transition-colors"
                    />
                    <input
                      type="text"
                      value={form.address.pincode}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          address: {
                            ...form.address,
                            pincode: e.target.value,
                          },
                        })
                      }
                      placeholder="Pincode"
                      className="bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-neutral-600 rounded-xl px-4 py-3 text-sm transition-colors"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-3 cursor-pointer rounded-full border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 text-sm font-light transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 cursor-pointer rounded-full bg-white text-black hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-500 text-sm font-light transition-colors"
                  >
                    {submitting ? "Saving..." : "Save Client"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-neutral-950 border border-neutral-800 rounded-3xl w-full max-w-sm p-8 flex flex-col items-center text-center gap-6 shadow-2xl animate-in zoom-in-95 duration-200">
              {/* Warning Icon */}
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/10 flex items-center justify-center text-red-500">
                <svg
                  cursor-pointer
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
                  Delete Client?
                </h3>
                <p className="text-sm text-neutral-400">
                  Are you sure you want to delete this client? This action
                  cannot be undone.
                </p>
              </div>

              <div className="flex flex-wrap w-full gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setClientToDelete(null);
                  }}
                  className="flex-1 cursor-pointer px-5 py-3 rounded-full border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 text-sm font-light transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={submitting}
                  className="flex-1 cursor-pointer px-5 py-3 rounded-full bg-red-700 hover:bg-red-500 disabled:bg-neutral-900 disabled:text-neutral-500 text-white text-sm font-light transition-colors"
                >
                  {submitting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
