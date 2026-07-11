"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
;
import PillButton from "@/components/PillButton";
import api from "@/lib/axios";

type Client = {
  id: string;
  name: string;
  companyName: string | null;
  email: string | null;
  phoneNumber: string | null;
  taxId: string | null;
  address: any;
  Project?: any[];
  Invoice?: any[];
  Quotation?: any[];
};

type ClientFormState = {
  name: string;
  companyName: string;
  email: string;
  phoneNumber: string;
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

const getInitials = (name: string) => {
  if (!name || !name.trim()) return "??";
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

export default function Clients() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  const [form, setForm] = useState<ClientFormState>({
    name: "",
    companyName: "",
    email: "",
    phoneNumber: "",
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

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await api.get("/clients");
      setClients(res.data.data);
    } catch (err) {
      console.error("Failed to fetch clients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const openAddModal = () => {
    setEditingClient(null);
    setForm({
      name: "",
      companyName: "",
      email: "",
      phoneNumber: "",
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
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);

    const addrObj =
      typeof client.address === "object" && client.address !== null
        ? client.address
        : {};

    setForm({
      name: client.name,
      companyName: client.companyName || "",
      email: client.email || "",
      phoneNumber: client.phoneNumber || "",
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
      fetchClients();
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
        phoneNumber: form.phoneNumber.trim() || undefined,
        taxId: form.taxId.trim() || undefined,
        address: form.address,
      };
      if (editingClient) {
        await api.put(`/clients/${editingClient.id}`, payload);
      } else {
        await api.post("/clients", payload);
      }
      setIsModalOpen(false);
      fetchClients();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <main className="w-full overflow-x-clip py-8 px-4 md:px-12">
        <div className="flex flex-col w-full h-full gap-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center w-full justify-between gap-4">
            <div className="flex flex-col">
              <h1 className="text-4xl font-light -tracking-[4%] text-white">
                Clients
              </h1>
            </div>
            <PillButton
              onClickFunction={openAddModal}
              arrow={false}
              disabled={false}
              title="Add client"
            />
          </div>

          {/* Clients Table */}
          <div className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl overflow-x-auto shadow-xl">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-neutral-900/40 border-b border-neutral-800">
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-neutral-500 font-medium">
                    Client
                  </th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-neutral-500 font-medium">
                    Company
                  </th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-neutral-500 font-medium">
                    Email
                  </th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-neutral-500 font-medium">
                    Projects
                  </th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-neutral-500 font-medium">
                    Tax ID
                  </th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-neutral-500 font-medium text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-6 py-5">
                          <div className="h-4 bg-neutral-900 rounded animate-pulse w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : clients.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-16 text-center text-neutral-500 text-sm"
                    >
                      No clients found
                    </td>
                  </tr>
                ) : (
                  clients.map((client) => {
                    const displayCompany = client.companyName || "—";
                    const displayEmail = client.email || "—";
                    const displayTax = client.taxId || "—";

                    return (
                      <tr
                        key={client.id}
                        onClick={() => router.push(`/clients/${client.id}`)}
                        className="hover:bg-neutral-900/30 transition-colors duration-150 cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-semibold text-neutral-300">
                              {getInitials(client.name)}
                            </div>
                            <span className="text-sm font-medium text-white">
                              {client.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-300">
                          {displayCompany}
                        </td>
                        <td className="px-6 py-5 text-sm text-neutral-400">
                          {displayEmail}
                        </td>
                        <td className="px-6 py-5 text-sm">
                          {client.Project && client.Project.length > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              {client.Project.length} Project{client.Project.length !== 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="text-neutral-500 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-6 py-5 text-sm text-neutral-400">
                          {displayTax}
                        </td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-3">
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
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Modal Overlay */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="bg-neutral-950 border border-neutral-800/40 rounded-3xl w-full max-w-lg p-8 flex flex-col gap-6 shadow-2xl animate-in fade-in zoom-in-95 duration-250">
                <div className="flex items-center justify-between">
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
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
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
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={form.phoneNumber}
                      onChange={(e) =>
                        setForm({ ...form, phoneNumber: e.target.value })
                      }
                      placeholder="e.g. +1 234 567 8900"
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
                    <div className="grid grid-cols-3 gap-3">
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

                <div className="flex w-full gap-3 mt-2">
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
      </main>
    </div>
  );
};
