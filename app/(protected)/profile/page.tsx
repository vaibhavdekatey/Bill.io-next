"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import api from "@/lib/axios";

// ─── helpers ────────────────────────────────────────────────────────────────

const getInitials = (name: string | null | undefined) => {
  if (!name || !name.trim()) return "??";
  return name.trim().split(/\s+/).map((n) => n[0]).join("").slice(0, 2).toUpperCase();
};

const parseAddress = (addr: any): string | null => {
  if (!addr) return null;
  if (typeof addr === "string") return addr;
  if (typeof addr === "object") {
    const lines = [addr.line1, addr.line2, addr.line3].filter(Boolean);
    const cityState = [addr.city, addr.state, addr.pincode].filter(Boolean).join(", ");
    if (cityState) lines.push(cityState);
    if (lines.length > 0) return lines.join(", ");
    if (addr.address) return addr.address;
    if (addr.full) return addr.full;
  }
  return null;
};

const parseAddressFields = (raw: any) => {
  const empty = { line1: "", line2: "", line3: "", city: "", state: "", pincode: "" };
  if (!raw) return empty;

  let obj = raw;
  if (typeof raw === "string") {
    try {
      obj = JSON.parse(raw);
    } catch {
      return { ...empty, line1: raw };
    }
  }

  if (typeof obj === "object" && obj !== null) {
    return {
      line1: obj.line1 || obj.address || obj.full || "",
      line2: obj.line2 || "",
      line3: obj.line3 || "",
      city: obj.city || "",
      state: obj.state || "",
      pincode: obj.pincode || "",
    };
  }

  return { ...empty, line1: String(raw) };
};

// ─── sub-components ─────────────────────────────────────────────────────────

const DetailRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] uppercase tracking-wider text-neutral-500">{label}</span>
    <span className="text-sm text-white font-light">
      {value || <span className="text-neutral-600">—</span>}
    </span>
  </div>
);

const FormField = ({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs uppercase tracking-wider text-neutral-400 font-medium">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

const inputCls =
  "bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-neutral-600 rounded-xl px-4 py-3 text-sm transition-colors placeholder:text-neutral-600";

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ─── main component ──────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, organization, logout, update } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local synced state for instant UI updates and fresh data
  const [currentOrg, setCurrentOrg] = useState<any>(organization?.Organization || null);
  const [currentUser, setCurrentUser] = useState<any>(user || null);

  useEffect(() => {
    if (organization?.Organization) {
      setCurrentOrg(organization.Organization);
    }
  }, [organization?.Organization]);

  useEffect(() => {
    if (user) {
      setCurrentUser(user);
    }
  }, [user]);

  // Fetch the latest fresh organization details on mount to guarantee up-to-date address
  useEffect(() => {
    api.get("/organization")
      .then((res) => {
        if (res.data?.data) {
          setCurrentOrg(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  // logo
  const [uploading, setUploading] = useState(false);
  const [removingLogo, setRemovingLogo] = useState(false);

  // edit profile modal
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", phoneNumber: "" });
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileError, setProfileError] = useState("");

  // edit org modal
  const [orgOpen, setOrgOpen] = useState(false);
  const [orgForm, setOrgForm] = useState({
    name: "",
    email: "",
    phone: "",
    website: "",
    taxId: "",
    address: { line1: "", line2: "", line3: "", city: "", state: "", pincode: "" },
  });
  const [orgSubmitting, setOrgSubmitting] = useState(false);
  const [orgError, setOrgError] = useState("");

  const parsedAddress = parseAddress(currentOrg?.address);

  // ── logo actions ────────────────────────────────────────────────────────

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("logo", file);
      const res = await api.post("/organization/logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.data?.logoUrl) {
        setCurrentOrg((prev: any) => prev ? { ...prev, logoUrl: res.data.data.logoUrl } : prev);
      }
      await update({ trigger: "update" });
    } catch {
      alert("Failed to upload logo. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleLogoRemove = async () => {
    if (!window.confirm("Remove the current logo?")) return;
    try {
      setRemovingLogo(true);
      await api.delete("/organization/logo");
      setCurrentOrg((prev: any) => prev ? { ...prev, logoUrl: null } : prev);
      await update({ trigger: "update" });
    } catch {
      alert("Failed to remove logo. Please try again.");
    } finally {
      setRemovingLogo(false);
    }
  };

  // ── open modals with pre-filled data ───────────────────────────────────

  const openProfileModal = () => {
    setProfileForm({
      name: currentUser?.name || "",
      phoneNumber: currentUser?.phoneNumber || "",
    });
    setProfileError("");
    setProfileOpen(true);
  };

  const openOrgModal = () => {
    const addr = parseAddressFields(currentOrg?.address);
    setOrgForm({
      name: currentOrg?.name || "",
      email: currentOrg?.email || "",
      phone: currentOrg?.phone || "",
      website: currentOrg?.website || "",
      taxId: currentOrg?.taxId || "",
      address: addr,
    });
    setOrgError("");
    setOrgOpen(true);
  };

  // ── submit handlers ─────────────────────────────────────────────────────

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      setProfileError("Name is required.");
      return;
    }
    try {
      setProfileSubmitting(true);
      setProfileError("");
      const res = await api.patch("/user", {
        name: profileForm.name.trim(),
        phoneNumber: profileForm.phoneNumber.trim() || null,
      });
      if (res.data?.data) {
        setCurrentUser((prev: any) => ({ ...prev, ...res.data.data }));
      }
      await update({ trigger: "update" });
      setProfileOpen(false);
    } catch (err: any) {
      setProfileError(err?.response?.data?.message || "Failed to update profile.");
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handleOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgForm.name.trim()) {
      setOrgError("Organization name is required.");
      return;
    }
    try {
      setOrgSubmitting(true);
      setOrgError("");
      const res = await api.patch("/organization", {
        name: orgForm.name.trim(),
        email: orgForm.email.trim() || null,
        phone: orgForm.phone.trim() || null,
        website: orgForm.website.trim() || null,
        taxId: orgForm.taxId.trim() || null,
        address: orgForm.address,
      });
      if (res.data?.data) {
        setCurrentOrg(res.data.data);
      }
      await update({ trigger: "update" });
      setOrgOpen(false);
    } catch (err: any) {
      setOrgError(err?.response?.data?.message || "Failed to update organization.");
    } finally {
      setOrgSubmitting(false);
    }
  };

  // ── render ──────────────────────────────────────────────────────────────

  return (
    <main className="w-full overflow-y-auto py-8 px-4 md:px-12">
      <div className="flex flex-col w-full max-w-3xl mx-auto gap-8">

        {/* ── Page Header ── */}
        <div className="flex flex-col">
          <h1 className="text-4xl font-light -tracking-[4%] text-white">Profile</h1>
          <p className="text-neutral-400 text-sm mt-1">Your account &amp; organization details</p>
        </div>

        {/* ── User Card ── */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 md:p-8 flex flex-col gap-8 shadow-xl relative">
          <button
            onClick={openProfileModal}
            className="absolute top-6 right-6 md:top-8 md:right-8 text-neutral-400 hover:text-white transition-colors flex gap-2 items-center text-sm border border-neutral-800 rounded-full px-4 py-2 hover:border-neutral-600 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
            <span className="hidden sm:inline">Edit Profile</span>
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neutral-600 to-neutral-900 border border-neutral-700 flex items-center justify-center text-2xl font-semibold text-neutral-200 shrink-0">
              {getInitials(currentUser?.name)}
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-light text-white">{currentUser?.name || "—"}</h2>
              <span className="text-sm text-neutral-400">{currentUser?.email}</span>
              {organization?.title && (
                <span className="mt-1 px-3 py-0.5 rounded-full text-xs font-medium bg-neutral-800 text-neutral-300 w-fit border border-neutral-700">
                  {organization.title}
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-neutral-800" />

          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-widest text-neutral-500 mb-3">Account Details</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
              <DetailRow label="Full Name" value={currentUser?.name} />
              <DetailRow label="Email" value={currentUser?.email} />
              <DetailRow label="Phone Number" value={currentUser?.phoneNumber} />
              <DetailRow label="Role" value={organization?.role} />
              <DetailRow label="Title" value={organization?.title} />
            </div>
          </div>
        </div>

        {/* ── Organization Card ── */}
        {currentOrg && (
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-xl relative">
            <button
              onClick={openOrgModal}
              className="absolute top-6 right-6 md:top-8 md:right-8 text-neutral-400 hover:text-white transition-colors flex gap-2 items-center text-sm border border-neutral-800 rounded-full px-4 py-2 hover:border-neutral-600 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
              <span className="hidden sm:inline">Edit Organization</span>
            </button>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <span className="text-xs uppercase tracking-widest text-neutral-500">Organization</span>
            </div>

            {/* Logo section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div
                className={`relative group ${uploading || removingLogo ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                onClick={() => { if (!uploading && !removingLogo) fileInputRef.current?.click(); }}
              >
                {currentOrg.logoUrl ? (
                  <img
                    src={currentOrg.logoUrl.startsWith("http") ? currentOrg.logoUrl : `http://localhost:3000${currentOrg.logoUrl}`}
                    alt={currentOrg.name}
                    className="h-16 w-auto rounded-md p-1 object-contain border border-neutral-700 group-hover:opacity-50 transition-opacity"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-700 flex items-center justify-center text-lg font-semibold text-neutral-400 group-hover:bg-neutral-800 transition-colors">
                    {getInitials(currentOrg.name)}
                  </div>
                )}
                {(uploading || removingLogo) ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-light text-white">{currentOrg.name}</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { if (!uploading && !removingLogo) fileInputRef.current?.click(); }}
                    disabled={uploading || removingLogo}
                    className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {uploading ? "Uploading…" : "Upload logo"}
                  </button>
                  {currentOrg.logoUrl && !uploading && !removingLogo && (
                    <>
                      <span className="text-neutral-700 text-xs">·</span>
                      <button
                        onClick={handleLogoRemove}
                        className="text-xs text-red-500/70 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        {removingLogo ? "Removing…" : "Remove"}
                      </button>
                    </>
                  )}
                </div>
                <span className="text-[11px] text-neutral-700">JPEG or PNG, max 2 MB</span>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/jpeg,image/png"
                onChange={handleLogoUpload}
                disabled={uploading || removingLogo}
              />
            </div>

            <div className="border-t border-neutral-800" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
              <DetailRow label="Email" value={currentOrg.email} />
              <DetailRow label="Phone" value={currentOrg.phone} />
              <DetailRow label="Website" value={currentOrg.website} />
              <DetailRow label="Tax ID / GSTIN" value={currentOrg.taxId} />
              <DetailRow label="Address" value={parsedAddress} />
            </div>
          </div>
        )}

        {/* ── Logout ── */}
        <div className="flex justify-end">
          <button
            onClick={async () => { await logout(); router.push("/login"); }}
            className="px-6 py-3 cursor-pointer rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h6q.425 0 .713.288T12 4t-.288.713T11 5H5v14h6q.425 0 .713.288T12 20t-.288.713T11 21zm12.175-8H10q-.425 0-.712-.288T9 12t.288-.712T10 11h7.175L15.3 9.125q-.275-.275-.275-.675t.275-.7t.7-.313t.725.288L20.3 11.3q.3.3.3.7t-.3.7l-3.575 3.575q-.3.3-.712.288t-.713-.313q-.275-.3-.262-.712t.287-.688z" />
            </svg>
            Log out
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          Edit Profile Modal
      ════════════════════════════════════════════════════════ */}
      {profileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-neutral-800/40 rounded-3xl w-full max-w-md p-8 flex flex-col gap-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-4xl font-light text-white">Edit Profile</h3>
              <button onClick={() => setProfileOpen(false)} className="text-neutral-400 hover:text-white transition-colors cursor-pointer">
                <CloseIcon />
              </button>
            </div>

            {profileError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
                {profileError}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
              <FormField label="Full Name" required>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="e.g. Vaibhav Dekatey"
                  className={inputCls}
                  required
                />
              </FormField>

              <FormField label="Phone Number">
                <input
                  type="tel"
                  value={profileForm.phoneNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                  placeholder="e.g. +91 98765 43210"
                  className={inputCls}
                />
              </FormField>

              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setProfileOpen(false)}
                  className="px-5 py-3 cursor-pointer rounded-full border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 text-sm font-light transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileSubmitting}
                  className="px-6 py-3 cursor-pointer rounded-full bg-white text-black hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-500 text-sm font-light transition-colors"
                >
                  {profileSubmitting ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          Edit Organization Modal
      ════════════════════════════════════════════════════════ */}
      {orgOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-neutral-800/40 rounded-3xl w-full max-w-lg p-8 flex flex-col gap-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-4xl font-light text-white">Edit Organization</h3>
              <button onClick={() => setOrgOpen(false)} className="text-neutral-400 hover:text-white transition-colors cursor-pointer">
                <CloseIcon />
              </button>
            </div>

            {orgError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
                {orgError}
              </div>
            )}

            <form onSubmit={handleOrgSubmit} className="flex flex-col gap-4">
              <FormField label="Organization Name" required>
                <input
                  type="text"
                  value={orgForm.name}
                  onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                  placeholder="e.g. Acme Labs"
                  className={inputCls}
                  required
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Email">
                  <input
                    type="email"
                    value={orgForm.email}
                    onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })}
                    placeholder="e.g. hello@acme.com"
                    className={inputCls}
                  />
                </FormField>
                <FormField label="Phone">
                  <input
                    type="tel"
                    value={orgForm.phone}
                    onChange={(e) => setOrgForm({ ...orgForm, phone: e.target.value })}
                    placeholder="e.g. +91 98765 43210"
                    className={inputCls}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Website">
                  <input
                    type="url"
                    value={orgForm.website}
                    onChange={(e) => setOrgForm({ ...orgForm, website: e.target.value })}
                    placeholder="e.g. https://acme.com"
                    className={inputCls}
                  />
                </FormField>
                <FormField label="Tax ID / GSTIN">
                  <input
                    type="text"
                    value={orgForm.taxId}
                    onChange={(e) => setOrgForm({ ...orgForm, taxId: e.target.value })}
                    placeholder="e.g. 27ABCDE1234F1Z5"
                    className={inputCls}
                  />
                </FormField>
              </div>

              {/* Address */}
              <div className="flex flex-col gap-3">
                <label className="text-xs uppercase tracking-wider text-neutral-400 font-medium">
                  Billing Address
                </label>
                <input
                  type="text"
                  value={orgForm.address.line1}
                  onChange={(e) => setOrgForm({ ...orgForm, address: { ...orgForm.address, line1: e.target.value } })}
                  placeholder="Address Line 1 (Street, House No.)"
                  className={inputCls}
                />
                <input
                  type="text"
                  value={orgForm.address.line2}
                  onChange={(e) => setOrgForm({ ...orgForm, address: { ...orgForm.address, line2: e.target.value } })}
                  placeholder="Address Line 2 (Apartment, Suite, Unit)"
                  className={inputCls}
                />
                <input
                  type="text"
                  value={orgForm.address.line3}
                  onChange={(e) => setOrgForm({ ...orgForm, address: { ...orgForm.address, line3: e.target.value } })}
                  placeholder="Address Line 3 (Landmark, Area)"
                  className={inputCls}
                />
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={orgForm.address.city}
                    onChange={(e) => setOrgForm({ ...orgForm, address: { ...orgForm.address, city: e.target.value } })}
                    placeholder="City"
                    className={inputCls}
                  />
                  <input
                    type="text"
                    value={orgForm.address.state}
                    onChange={(e) => setOrgForm({ ...orgForm, address: { ...orgForm.address, state: e.target.value } })}
                    placeholder="State"
                    className={inputCls}
                  />
                  <input
                    type="text"
                    value={orgForm.address.pincode}
                    onChange={(e) => setOrgForm({ ...orgForm, address: { ...orgForm.address, pincode: e.target.value } })}
                    placeholder="Pincode"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setOrgOpen(false)}
                  className="px-5 py-3 cursor-pointer rounded-full border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 text-sm font-light transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={orgSubmitting}
                  className="px-6 py-3 cursor-pointer rounded-full bg-white text-black hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-500 text-sm font-light transition-colors"
                >
                  {orgSubmitting ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
