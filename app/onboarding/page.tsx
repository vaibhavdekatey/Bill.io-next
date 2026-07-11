"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
;
import api from "@/lib/axios";

type AccountType = "freelancer" | "agency";

const ACCOUNT_TYPES: {
  icon: React.ReactNode;
  type: AccountType;
  label: string;
  description: string;
}[] = [
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="88"
        height="88"
        viewBox="0 0 24 24"
      >
        <path
          fill="currentColor"
          d="M12 4.75a2.25 2.25 0 1 0 0 4.5a2.25 2.25 0 0 0 0-4.5M8.25 7a3.75 3.75 0 1 1 7.5 0a3.75 3.75 0 0 1-7.5 0m1.064 5.819c.132.098.302.213.505.327c.513.29 1.265.59 2.18.59s1.668-.3 2.181-.59c.203-.114.373-.229.505-.327q.282.075.559.166l.96.315c.72.237 1.264.812 1.458 1.523l.397 2.864c.075.544-.21.939-.606 1.033c-1.047.25-2.812.53-5.453.53s-4.407-.28-5.454-.53c-.395-.094-.68-.489-.606-1.033l.397-2.864A2.23 2.23 0 0 1 7.796 13.3l.96-.315q.276-.09.558-.166m.71-1.355l-.291-.287l-.402.092q-.526.12-1.044.291l-.96.315a3.72 3.72 0 0 0-2.454 2.616l-.01.04l-.408 2.95c-.161 1.164.462 2.393 1.744 2.698c1.17.279 3.052.571 5.8.571c2.749 0 4.631-.292 5.801-.57c1.282-.306 1.906-1.535 1.745-2.698l-.409-2.95l-.01-.04a3.72 3.72 0 0 0-2.455-2.617l-.959-.315q-.517-.17-1.044-.29l-.402-.093l-.29.286l-.001.001a2 2 0 0 1-.12.101a3 3 0 0 1-.41.274a2.96 2.96 0 0 1-1.445.397a2.96 2.96 0 0 1-1.445-.397a3.2 3.2 0 0 1-.53-.375"
        />
      </svg>
    ),
    type: "freelancer",
    label: "Freelancer",
    description:
      "Independent professional. Manage clients, invoices, and quotes solo.",
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="88"
        height="88"
        viewBox="0 0 24 24"
      >
        <path
          fill="currentColor"
          d="M18 15h-2v2h2m0-6h-2v2h2m2 6h-8v-2h2v-2h-2v-2h2v-2h-2V9h8M10 7H8V5h2m0 6H8V9h2m0 6H8v-2h2m0 6H8v-2h2M6 7H4V5h2m0 6H4V9h2m0 6H4v-2h2m0 6H4v-2h2m6-10V3H2v18h20V7z"
        />
      </svg>
    ),
    type: "agency",
    label: "Agency",
    description:
      "Team or studio. Collaborate across clients with shared dashboards.",
  },
];

const Onboarding = () => {
  const { user, setOnboardingComplete, logout } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1
  const [organizationName, setOrganizationName] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("freelancer");
  const [taxId, setTaxId] = useState("");

  // Step 2
  const [orgEmail, setOrgEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!organizationName.trim()) {
      setError("Organization name is required.");
      return;
    }
    setStep(2);
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/onboarding", {
        organizationName,
        accountType,
        taxId: taxId || undefined,
        email: orgEmail || undefined,
        phone: phone || undefined,
        website: website || undefined,
        address: address ? { address } : undefined,
      });
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    setOnboardingComplete(true);
    router.push("/dashboard");
  };

  return (
    <div className="bg-black h-screen w-screen flex flex-col items-center justify-center text-white font-lexend p-6 relative overflow-x-hidden">
      <div className="absolute inset-4  bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-full blur-3xl opacity-40 group-hover:opacity-100 transition duration-1000 my-36 mx-[30vw]" />
      <div className="w-28 h-fit absolute p-3 top-6 left-6 ">
        <img
          className="w-full h-full"
          src="/bill.io_ico.svg"
          alt="Bill.io Icon"
        />
      </div>
      <div
        onClick={logout}
        className="absolute p-3 text-red-400 border border-white/30 hover:border-white/50 bg-neutral-800/40 hover:bg-neutral-600 rounded-xl top-8 right-8 transition-all duration-500 ease-in-out cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h6q.425 0 .713.288T12 4t-.288.713T11 5H5v14h6q.425 0 .713.288T12 20t-.288.713T11 21zm12.175-8H10q-.425 0-.712-.288T9 12t.288-.712T10 11h7.175L15.3 9.125q-.275-.275-.275-.675t.275-.7t.7-.313t.725.288L20.3 11.3q.3.3.3.7t-.3.7l-3.575 3.575q-.3.3-.712.288t-.713-.313q-.275-.3-.262-.712t.287-.688z"
          />
        </svg>
      </div>
      <div className="z-10 relative w-full flex flex-col justify-center items-center ">
        {/* Progress indicator */}
        {step !== 3 && (
          <div className="flex items-center gap-x-2 mb-10">
            {[1, 2].map((s) => (
              <React.Fragment key={s}>
                <div
                  className={`w-2 h-2 rounded-full transition-all duration-500 ${
                    s <= step ? "bg-white scale-125" : "bg-white/20"
                  }`}
                />
                {s < 2 && (
                  <div
                    className={`w-8 h-px transition-all duration-500 ${step > s ? "bg-white/60" : "bg-white/20"}`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        <div className="w-full max-w-xl">
          {/* STEP 1 */}
          {step === 1 && (
            <form
              onSubmit={handleStep1}
              className="flex flex-col gap-y-6 animate-fade-in"
            >
              <div className="w-full text-center">
                <p className="text-white/50 text-sm mb-1">
                  Welcome, {user?.name}
                </p>
                <h1 className="text-7xl font-extralight">Define your role</h1>
              </div>

              {/* Account type cards */}
              <div className="flex flex-row gap-x-3">
                {ACCOUNT_TYPES.map(({ type, label, description, icon }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAccountType(type)}
                    className={`text-left p-5 rounded-xl border transition-all duration-300 cursor-pointer ${
                      accountType === type
                        ? "border-white/30 bg-white/5"
                        : "border-neutral-800 hover:border-neutral-600"
                    }`}
                  >
                    <div className="flex flex-col items-start justify-between">
                      <div className="fill-amber-50 text-white aspect-square w-20 h-20 mb-12">
                        {icon}
                      </div>
                      <span className="font-extralight tracking-tight text-3xl capitalize">
                        {label}
                      </span>
                    </div>
                    <p className="text-white/50 text-sm mt-1">{description}</p>
                  </button>
                ))}
              </div>

              {/* Organization name */}
              <div className="flex flex-col gap-y-2">
                <label className="text-sm text-white/60">
                  Organization name *
                </label>
                <input
                  className="bg-neutral-900 border border-neutral-800 focus:border-white/40 outline-none p-4 rounded-lg w-full transition-colors duration-200"
                  placeholder="e.g. Acme Studio"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  required
                />
              </div>

              {/* GSTIN optional */}
              <div className="flex flex-col gap-y-2">
                <label className="text-sm text-white/60">
                  GSTIN <span className="text-white/30">(optional)</span>
                </label>
                <input
                  className="bg-neutral-900 border border-neutral-800 focus:border-white/40 outline-none p-4 rounded-lg w-full transition-colors duration-200"
                  placeholder="e.g. 22AAAAA0000A1Z5"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value.toUpperCase())}
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                className="bg-white text-black font-medium rounded-lg py-3 w-full hover:bg-white/90 transition-colors duration-300 cursor-pointer"
              >
                Continue →
              </button>
            </form>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <form
              onSubmit={handleStep2}
              className="flex flex-col gap-y-6 animate-fade-in"
            >
              <div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-white/40 hover:text-white text-sm mb-4 flex items-center gap-x-1 transition-colors duration-200 cursor-pointer"
                >
                  ← Back
                </button>
                <h1 className="text-3xl font-light">Contact details</h1>
                <p className="text-white/50 text-sm mt-2">
                  These appear on your invoices and quotes. You can update them
                  later.
                </p>
              </div>

              <div className="flex flex-col gap-y-4">
                <div className="flex flex-col gap-y-2">
                  <label className="text-sm text-white/60">
                    Business email
                  </label>
                  <input
                    className="bg-neutral-900 border border-neutral-800 focus:border-white/40 outline-none p-4 rounded-lg w-full transition-colors duration-200"
                    placeholder="hello@yourstudio.com"
                    type="email"
                    value={orgEmail}
                    onChange={(e) => setOrgEmail(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-y-2">
                    <label className="text-sm text-white/60">Phone number</label>
                    <input
                      className="bg-neutral-900 border border-neutral-800 focus:border-white/40 outline-none p-4 rounded-lg w-full transition-colors duration-200"
                      placeholder="+1 (555) 000-0000"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-y-2">
                    <label className="text-sm text-white/60">Website (Optional)</label>
                    <input
                      className="bg-neutral-900 border border-neutral-800 focus:border-white/40 outline-none p-4 rounded-lg w-full transition-colors duration-200"
                      placeholder="https://acmecorp.com"
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-y-2 mt-4">
                  <label className="text-sm text-white/60">
                    Business address
                  </label>
                  <textarea
                    className="bg-neutral-900 border border-neutral-800 focus:border-white/40 outline-none p-4 rounded-lg w-full transition-colors duration-200 resize-none"
                    placeholder="123 Studio Lane, Mumbai, 400001"
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <div className="flex gap-x-3">
                {/* <button
                type="button"
                onClick={() => {
                  setError("");
                  setStep(3);
                  setOnboardingComplete(true);
                  }}
                  className="flex-1 border border-neutral-700 text-white/60 hover:text-white hover:border-neutral-500 rounded-lg py-3 transition-all duration-300 text-sm"
                  >
                  Skip for now
                  </button> */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-white text-black font-medium rounded-lg py-3 hover:bg-white/90 transition-colors duration-300 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    "Finish setup →"
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 3: All Set ── */}
          {step === 3 && (
            <div className="flex flex-col items-center text-center gap-y-6 animate-fade-in">
              {/* Check animation */}
              <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center mb-2">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <div>
                <h1 className="text-3xl font-light mb-2">You're all set.</h1>
                <p className="text-white/50 text-sm max-w-sm">
                  <span className="text-white font-medium">
                    {organizationName}
                  </span>{" "}
                  is ready to go. Start creating invoices, managing clients, and
                  tracking payments.
                </p>
              </div>

              <div className="w-full border-t border-white/10 pt-6 flex flex-col gap-y-3">
                <div className="flex items-center gap-x-3 text-sm text-white/50">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                  Create your first invoice
                </div>
                <div className="flex items-center gap-x-3 text-sm text-white/50">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                  Add a client
                </div>
              </div>

              <button
                onClick={handleFinish}
                className="w-full bg-white text-black font-medium rounded-lg py-3 cursor-pointer hover:bg-white/90 transition-colors duration-300 mt-2"
              >
                Go to Dashboard →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
