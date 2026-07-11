"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import api from "@/lib/axios";

const getInitials = (name: string | null | undefined) => {
  if (!name || !name.trim()) return "??";
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const Profile = () => {
  const { user, organization, logout, update } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("logo", file);

      await api.post("/organization/logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await update({ trigger: "update" });
    } catch (err) {
      console.error("Failed to upload logo", err);
      alert("Failed to upload logo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const org = organization?.Organization;

  const parsedAddress =
    org?.address && typeof org.address === "object"
      ? (org.address as any).address ||
        (org.address as any).full ||
        JSON.stringify(org.address)
      : typeof org?.address === "string"
        ? org.address
        : null;

  return (
    <main className="w-full overflow-y-auto py-8 px-4 md:px-12">
      <div className="flex flex-col w-full max-w-3xl mx-auto gap-8">
        {/* Page Header */}
        <div className="flex flex-row items-center w-full justify-between">
          <div className="flex flex-col">
            <h1 className="text-4xl font-light -tracking-[4%] text-white">
              Profile
            </h1>
            <p className="text-neutral-400 text-sm mt-1">
              Your account & organization details
            </p>
          </div>
        </div>

        {/* User Card */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 md:p-8 flex flex-col gap-8 shadow-xl relative">
          <button
            className="absolute top-6 right-6 md:top-8 md:right-8 text-neutral-400 hover:text-white transition-colors flex gap-2 items-center text-sm border border-neutral-800 rounded-full px-4 py-2 hover:border-neutral-600"
            onClick={() => alert("Edit Profile: Coming Soon!")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
            </svg>
            <span className="hidden sm:inline">Edit Profile</span>
          </button>

          {/* User Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neutral-600 to-neutral-900 border border-neutral-700 flex items-center justify-center text-2xl font-semibold text-neutral-200 shrink-0">
              {getInitials(user?.name)}
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-light text-white">
                {user?.name || "—"}
              </h2>
              <span className="text-sm text-neutral-400">{user?.email}</span>
              {organization?.title && (
                <span className="mt-1 px-3 py-0.5 rounded-full text-xs font-medium bg-neutral-800 text-neutral-300 w-fit border border-neutral-700">
                  {organization.title}
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-neutral-800" />

          {/* Detail Grid */}
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-widest text-neutral-500 mb-3">
              Account Details
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
              <DetailRow label="Full Name" value={user?.name} />
              <DetailRow label="Email" value={user?.email} />
              <DetailRow label="Phone Number" value={(user as any)?.phoneNumber} />
              <DetailRow label="Role" value={organization?.role} />
              <DetailRow label="Title" value={organization?.title} />
            </div>
          </div>
        </div>

        {/* Organization Card */}
        {org && (
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <span className="text-xs uppercase tracking-widest text-neutral-500">
                Organization
              </span>
              {org.createdAt && (
                <span className="text-xs text-neutral-600">
                  Created {formatDate(org.createdAt)}
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div
                className={`relative group ${uploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                onClick={() => {
                  if (!uploading) fileInputRef.current?.click();
                }}
              >
                {org.logoUrl ? (
                  <img
                    src={
                      org.logoUrl.startsWith("http")
                        ? org.logoUrl
                        : `http://localhost:3000${org.logoUrl}`
                    }
                    alt={org.name}
                    className="h-16 w-auto rounded-md p-1 object-contain border border-neutral-700 group-hover:opacity-50 transition-opacity"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-700 flex items-center justify-center text-lg font-semibold text-neutral-400 group-hover:bg-neutral-800 transition-colors">
                    {getInitials(org.name)}
                  </div>
                )}
                {uploading ? (
                  <div className="absolute inset-0 flex items-center justify-center opacity-100 transition-opacity">
                    <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-light text-white">{org.name}</h3>
                <span className="text-xs text-neutral-500">
                  {uploading
                    ? "Uploading..."
                    : "Click to upload (JPEG/PNG, Max 2MB)"}
                </span>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/jpeg,image/png"
                onChange={handleLogoUpload}
                disabled={uploading}
              />
            </div>

            <div className="border-t border-neutral-800" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
              <DetailRow label="Email" value={org.email} />
              <DetailRow label="Phone" value={org.phone} />
              <DetailRow label="Tax ID / GSTIN" value={org.taxId} />
              <DetailRow label="Address" value={parsedAddress} />
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="flex justify-end">
          <button
            onClick={async () => {
              await logout();
              router.push("/login");
            }}
            className="px-6 py-3 cursor-pointer rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h6q.425 0 .713.288T12 4t-.288.713T11 5H5v14h6q.425 0 .713.288T12 20t-.288.713T11 21zm12.175-8H10q-.425 0-.712-.288T9 12t.288-.712T10 11h7.175L15.3 9.125q-.275-.275-.275-.675t.275-.7t.7-.313t.725.288L20.3 11.3q.3.3.3.7t-.3.7l-3.575 3.575q-.3.3-.712.288t-.713-.313q-.275-.3-.262-.712t.287-.688z" />
            </svg>
            Log out
          </button>
        </div>
      </div>
    </main>
  );
};

/* Reusable detail row component */
const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] uppercase tracking-wider text-neutral-500">
      {label}
    </span>
    <span className="text-sm text-white font-light">
      {value || <span className="text-neutral-600">—</span>}
    </span>
  </div>
);

export default Profile;
