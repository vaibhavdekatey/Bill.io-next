"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";

type BankDetails = {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifscSwift: string;
  upiId: string;
};

type SettingsState = {
  defaultCurrency: string;
  defaultTaxRate: number;
  defaultPaymentTerms: string;
  invoicePrefix: string;
  quotationPrefix: string;
  defaultNotes: string;
  defaultTerms: string;
  bankDetails: BankDetails;
};

const CURRENCIES = [
  { code: "INR", symbol: "₹", name: "Indian Rupee (INR)" },
  { code: "USD", symbol: "$", name: "US Dollar (USD)" },
  { code: "EUR", symbol: "€", name: "Euro (EUR)" },
  { code: "GBP", symbol: "£", name: "British Pound (GBP)" },
  { code: "CAD", symbol: "$", name: "Canadian Dollar (CAD)" },
  { code: "AUD", symbol: "$", name: "Australian Dollar (AUD)" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham (AED)" },
];

const PAYMENT_TERMS_OPTIONS = [
  "Due on receipt",
  "Net 7",
  "Net 15",
  "Net 30",
  "Net 45",
  "Net 60",
];

const inputCls =
  "bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-neutral-600 rounded-xl px-4 py-3 text-sm transition-colors placeholder:text-neutral-600 w-full";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState("");

  const [settings, setSettings] = useState<SettingsState>({
    defaultCurrency: "INR",
    defaultTaxRate: 0,
    defaultPaymentTerms: "Net 30",
    invoicePrefix: "INV",
    quotationPrefix: "QUO",
    defaultNotes: "",
    defaultTerms: "",
    bankDetails: {
      bankName: "",
      accountHolder: "",
      accountNumber: "",
      ifscSwift: "",
      upiId: "",
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await api.get("/organization");
        const org = res.data?.data;
        if (org) {
          const bank = (org.bankDetails as any) || {};
          setSettings({
            defaultCurrency: org.defaultCurrency || "INR",
            defaultTaxRate: Number(org.defaultTaxRate) || 0,
            defaultPaymentTerms: org.defaultPaymentTerms || "Net 30",
            invoicePrefix: org.invoicePrefix || "INV",
            quotationPrefix: org.quotationPrefix || "QUO",
            defaultNotes: org.defaultNotes || "",
            defaultTerms: org.defaultTerms || "",
            bankDetails: {
              bankName: bank.bankName || "",
              accountHolder: bank.accountHolder || "",
              accountNumber: bank.accountNumber || "",
              ifscSwift: bank.ifscSwift || "",
              upiId: bank.upiId || "",
            },
          });
        }
      } catch (err: any) {
        console.error("Failed to load settings:", err);
        setError("Failed to load organization settings");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setSaveSuccess(false);

      await api.patch("/organization", {
        defaultCurrency: settings.defaultCurrency,
        defaultTaxRate: settings.defaultTaxRate,
        defaultPaymentTerms: settings.defaultPaymentTerms,
        invoicePrefix: settings.invoicePrefix.trim() || "INV",
        quotationPrefix: settings.quotationPrefix.trim() || "QUO",
        defaultNotes: settings.defaultNotes,
        defaultTerms: settings.defaultTerms,
        bankDetails: settings.bankDetails,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error("Failed to save settings:", err);
      setError(err?.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="w-full py-12 px-4 md:px-12 flex justify-center items-center">
        <div className="text-neutral-400 font-light">Loading settings...</div>
      </main>
    );
  }

  return (
    <main className="w-full overflow-y-auto py-8 px-4 md:px-12">
      <div className="flex flex-col w-full max-w-4xl mx-auto gap-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col">
            <h1 className="text-4xl font-light -tracking-[4%] text-white">Settings</h1>
            <p className="text-neutral-400 text-sm mt-1">
              Configure billing defaults, bank payout details, and document templates
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 cursor-pointer rounded-full bg-white text-black hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-500 text-sm font-light transition-colors self-start sm:self-auto"
          >
            {saving ? "Saving Changes..." : "Save Settings"}
          </button>
        </div>

        {/* Feedback alerts */}
        {saveSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm px-4 py-3 rounded-2xl animate-in fade-in duration-200">
            ✓ Settings updated successfully
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-2xl animate-in fade-in duration-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="flex flex-col gap-8">
          {/* Card 1: Document & Billing Defaults */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-xl">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-light text-white">Billing &amp; Invoice Defaults</h2>
              <p className="text-xs text-neutral-500">
                These defaults will pre-populate every time you create a new Invoice or Quotation
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Default Currency */}
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wider text-neutral-400 font-medium">
                  Default Currency
                </label>
                <select
                  value={settings.defaultCurrency}
                  onChange={(e) =>
                    setSettings({ ...settings, defaultCurrency: e.target.value })
                  }
                  className={inputCls}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code} className="bg-neutral-900 text-white">
                      {c.name} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>

              {/* Default Tax Rate */}
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wider text-neutral-400 font-medium">
                  Standard Tax Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={settings.defaultTaxRate}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      defaultTaxRate: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="e.g. 18"
                  className={inputCls}
                />
              </div>

              {/* Default Payment Terms */}
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wider text-neutral-400 font-medium">
                  Default Payment Terms
                </label>
                <select
                  value={settings.defaultPaymentTerms}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      defaultPaymentTerms: e.target.value,
                    })
                  }
                  className={inputCls}
                >
                  {PAYMENT_TERMS_OPTIONS.map((term) => (
                    <option key={term} value={term} className="bg-neutral-900 text-white">
                      {term}
                    </option>
                  ))}
                </select>
              </div>

              {/* Document Numbering Prefixes */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-wider text-neutral-400 font-medium">
                    Invoice Prefix
                  </label>
                  <input
                    type="text"
                    value={settings.invoicePrefix}
                    onChange={(e) =>
                      setSettings({ ...settings, invoicePrefix: e.target.value })
                    }
                    placeholder="INV"
                    className={inputCls}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-wider text-neutral-400 font-medium">
                    Quotation Prefix
                  </label>
                  <input
                    type="text"
                    value={settings.quotationPrefix}
                    onChange={(e) =>
                      setSettings({ ...settings, quotationPrefix: e.target.value })
                    }
                    placeholder="QUO"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Banking & Payout Details */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-xl">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-light text-white">Bank &amp; Payment Details</h2>
              <p className="text-xs text-neutral-500">
                Information provided to clients for wire transfers and UPI payments
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wider text-neutral-400 font-medium">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={settings.bankDetails.bankName}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      bankDetails: {
                        ...settings.bankDetails,
                        bankName: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g. HDFC Bank, Chase"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wider text-neutral-400 font-medium">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  value={settings.bankDetails.accountHolder}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      bankDetails: {
                        ...settings.bankDetails,
                        accountHolder: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g. Acme Labs LLP"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wider text-neutral-400 font-medium">
                  Account Number / IBAN
                </label>
                <input
                  type="text"
                  value={settings.bankDetails.accountNumber}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      bankDetails: {
                        ...settings.bankDetails,
                        accountNumber: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g. 50200012345678"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wider text-neutral-400 font-medium">
                  IFSC / SWIFT / Routing Code
                </label>
                <input
                  type="text"
                  value={settings.bankDetails.ifscSwift}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      bankDetails: {
                        ...settings.bankDetails,
                        ifscSwift: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g. HDFC0001234"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-xs uppercase tracking-wider text-neutral-400 font-medium">
                  UPI ID / Direct Pay Handle (Optional)
                </label>
                <input
                  type="text"
                  value={settings.bankDetails.upiId}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      bankDetails: {
                        ...settings.bankDetails,
                        upiId: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g. acme@okhdfcbank"
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Default Notes & Terms Boilerplate */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-xl">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-light text-white">Default Notes &amp; Terms</h2>
              <p className="text-xs text-neutral-500">
                Standard text automatically inserted into notes and terms boxes on new bills
              </p>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wider text-neutral-400 font-medium">
                  Default Notes &amp; Payment Instructions
                </label>
                <textarea
                  rows={4}
                  value={settings.defaultNotes}
                  onChange={(e) =>
                    setSettings({ ...settings, defaultNotes: e.target.value })
                  }
                  placeholder="e.g. Thanks for working with us! Please transfer payments to the account details above."
                  className={`${inputCls} resize-y min-h-[90px] font-sans`}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wider text-neutral-400 font-medium">
                  Default Terms &amp; Conditions
                </label>
                <textarea
                  rows={4}
                  value={settings.defaultTerms}
                  onChange={(e) =>
                    setSettings({ ...settings, defaultTerms: e.target.value })
                  }
                  placeholder="e.g. Invoices are payable within the agreed terms. Overdue payments accrue interest at 1.5% per month."
                  className={`${inputCls} resize-y min-h-[90px] font-sans`}
                />
              </div>
            </div>
          </div>

          {/* Bottom Save Action */}
          <div className="flex justify-end gap-3 pb-8">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3.5 cursor-pointer rounded-full bg-white text-black hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-500 text-sm font-light transition-colors"
            >
              {saving ? "Saving Changes..." : "Save All Settings"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
