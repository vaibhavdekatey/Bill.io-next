"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
;
import api from "@/lib/axios";
import PillButton from "@/components/PillButton";
import { useAuth } from "@/context/AuthContext";

type LineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
};

type ClientForm = {
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

type ClientOption = {
  id: string;
  name: string;
  companyName?: string | null;
  email?: string | null;
  taxId?: string | null;
  address: {
    line1: string;
    line2: string;
    line3: string;
    city: string;
    state: string;
    pincode: string;
  };
};

const emptyItem = (): LineItem => ({
  id: crypto.randomUUID(),
  description: "",
  quantity: 1,
  unitPrice: 0,
  taxPercent: 18,
});

export default function NewQuotation() {
  const { organization } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;

  const [clients, setClients] = useState<ClientOption[]>([]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await api.get("/clients");

        const mappedClients = res.data.data.map((c: any) => {
          let parsedAddress: any = {
            line1: "",
            line2: "",
            line3: "",
            city: "",
            state: "",
            pincode: "",
          };

          if (typeof c.address === "string") {
            parsedAddress.line1 = c.address;
          } else if (typeof c.address === "object" && c.address !== null) {
            parsedAddress = {
              line1:
                c.address.line1 || c.address.address || c.address.full || "",
              line2: c.address.line2 || "",
              line3: c.address.line3 || "",
              city: c.address.city || "",
              state: c.address.state || "",
              pincode: c.address.pincode || "",
            };
          }

          return {
            id: c.id,
            name: c.name,
            companyName: c.companyName,
            email: c.email,
            taxId: c.taxId,
            address: parsedAddress,
          };
        });

        setClients(mappedClients);
      } catch (err) {
        console.error("Failed to fetch clients:", err);
      }
    };
    fetchClients();
  }, []);

  const [items, setItems] = useState<LineItem[]>([emptyItem()]);
  const [clientId, setClientId] = useState("");
  const [saveClient, setSaveClient] = useState(false);
  const [quotationNumber, setQuotationNumber] = useState("Auto-generated");
  const [discountPercentage, setDiscountPercentage] = useState<number>(10);

  const [client, setClient] = useState<ClientForm>({
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

  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [dueDate, setDueDate] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState(
    "Payment due within 14 days. Late payments may incur a 2% monthly fee.",
  );
  const [submitting, setSubmitting] = useState(false);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === clientId) ?? null,
    [clients, clientId],
  );

  const updateItem = (
    id: string,
    field: keyof LineItem,
    value: string | number,
  ) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (id: string) =>
    setItems((prev) =>
      prev.length === 1 ? prev : prev.filter((item) => item.id !== id),
    );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [items],
  );

  const taxTotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + (item.quantity * item.unitPrice * item.taxPercent) / 100,
        0,
      ),
    [items],
  );

  const discountAmount = useMemo(
    () => (subtotal * discountPercentage) / 100,
    [subtotal, discountPercentage],
  );

  const total = useMemo(
    () => subtotal - discountAmount + taxTotal,
    [subtotal, discountAmount, taxTotal],
  );

  useEffect(() => {
    const fetchQuotationNumber = async () => {
      try {
        const res = await api.get("/quotations?action=generate");
        setQuotationNumber(res.data.data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchQuotationNumber();
  }, [pathname]);

  useEffect(() => {
    if (!editId) return;

    const fetchQuotation = async () => {
      try {
        const res = await api.get(`/quotations/${editId}`);
        const quo = res.data.data;

        setQuotationNumber(quo.number);
        setClientId(quo.clientId || "");
        setCurrency(quo.currency);
        setIssueDate(quo.createdAt?.split("T")[0] || "");
        setDueDate(quo.validUntil?.split("T")[0] || "");
        setDiscountPercentage(Number(quo.discount) || 0);

        if (!quo.clientId) {
          const addr = quo.clientAddress;
          setClient({
            name: quo.clientName || "",
            companyName: quo.clientCompany || "",
            email: "",
            taxId: "",
            address:
              typeof addr === "object" && addr !== null
                ? {
                    line1: addr.line1 || addr.address || addr.full || "",
                    line2: addr.line2 || "",
                    line3: addr.line3 || "",
                    city: addr.city || "",
                    state: addr.state || "",
                    pincode: addr.pincode || "",
                  }
                : {
                    line1: typeof addr === "string" ? addr : "",
                    line2: "",
                    line3: "",
                    city: "",
                    state: "",
                    pincode: "",
                  },
          });
        }
        setItems(
          quo.QuotationItem.map((item: any) => ({
            id: crypto.randomUUID(),
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            taxPercent: 0,
          })),
        );
      } catch (err) {
        console.error("Failed to load quotation for editing:", err);
      }
    };
    fetchQuotation();
  }, [editId]);

  const handleSubmit = async (status: "DRAFT" | "SENT") => {
    try {
      setSubmitting(true);

      const payload = {
        clientId: clientId || undefined,
        saveClient: !clientId && saveClient,
        clientName: clientId
          ? selectedClient?.name
          : client.name.trim() || undefined,
        clientCompany: clientId
          ? selectedClient?.companyName || undefined
          : client.companyName.trim() || undefined,
        clientEmail: clientId
          ? selectedClient?.email || undefined
          : client.email.trim() || undefined,
        clientTaxId: clientId
          ? selectedClient?.taxId || undefined
          : client.taxId.trim() || undefined,
        clientAddress: clientId ? selectedClient?.address : client.address,
        issueDate,
        dueDate: dueDate || undefined,
        currency,
        status,
        discount: discountPercentage,
        notes: notes.trim() || undefined,
        terms: terms.trim() || undefined,
        items: items.map((item) => ({
          description: item.description.trim(),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          taxPercent: Number(item.taxPercent),
        })),
      };

      if (isEditMode) {
        await api.put(`/quotations/${editId}`, payload);
      } else {
        await api.post("/quotations", payload);
      }
      router.push("/quotations");
    } catch (error) {
      console.error("Error creating new quotation:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-lexend font-light">
      <div className="sticky top-0 z-10 px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-black">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/quotations")}
            className="text-neutral-400 cursor-pointer aspect-square w-10 rounded-full border border-neutral-400 hover:bg-neutral-200 hover:border-white hover:text-black transition-all duration-500 ease-in-out flex items-center justify-center"
          >
            <svg
              className="rotate-180"
              xmlns="http://www.w3.org/2000/svg"
              width="1.8em"
              height="1.8em"
              viewBox="0 0 24 24"
            >
              <path d="M0 0h24v24H0z" fill="none" />
              <path
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1"
                d="M19 12H5m14 0l-4 4m4-4l-4-4"
              />
            </svg>
          </button>
          <div>
            <div className="flex flex-col">
              <h1 className="text-4xl font-light -tracking-[4%] ">
                New Quotation
              </h1>
              <p className="text-neutral-400 text-base ">
                Create a New Quotation
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:ml-auto w-full sm:w-auto">
          <PillButton
            className="w-fit h-fit"
            onClickFunction={() => handleSubmit("DRAFT")}
            arrow={true}
            title={isEditMode ? "Update Draft" : "Save Draft"}
            disabled={submitting}
          />
          <PillButton
            className="w-fit h-fit"
            onClickFunction={() => handleSubmit("SENT")}
            arrow={true}
            title={isEditMode ? "Update Quotation" : "Send Quotation"}
            disabled={submitting}
            varient=""
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-x-4 gap-y-6 items-start px-4 pb-4">
        <div className=" flex flex-col gap-6 ">
          <Section title="Parties" hint="Billed by & billed to">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="flex flex-col gap-4">
                <span className="text-xs uppercase tracking-widest text-neutral-500 font-medium">
                  From
                </span>
                <Field label="Organization name">
                  <Input
                    placeholder={organization?.Organization?.name}
                    disabled
                  />
                </Field>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="GST / Tax ID">
                    <Input
                      placeholder={organization?.Organization?.taxId || ""}
                      disabled
                    />
                  </Field>
                  <Field label="Email">
                    <Input
                      type="email"
                      placeholder={organization?.Organization?.email || ""}
                      disabled
                    />
                  </Field>
                </div>
                <Field label="Address">
                  <Textarea
                    placeholder={
                      organization?.Organization?.address?.address || ""
                    }
                    disabled
                  />
                </Field>
              </div>

              <div className="flex flex-col gap-4">
                <span className="text-xs uppercase tracking-widest text-neutral-500 font-medium">
                  Bill to
                </span>

                <Field label="Client">
                  <Select value={clientId} onChange={setClientId}>
                    <option value="">+ Add new client</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName
                          ? `${c.companyName} — ${c.name}`
                          : c.name}
                      </option>
                    ))}
                  </Select>
                </Field>

                {!clientId ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Client name">
                        <Input
                          value={client.name}
                          onChange={(e) =>
                            setClient((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          placeholder="Priya Sharma"
                        />
                      </Field>
                      <Field label="Company name">
                        <Input
                          value={client.companyName}
                          onChange={(e) =>
                            setClient((prev) => ({
                              ...prev,
                              companyName: e.target.value,
                            }))
                          }
                          placeholder="Acme Studio"
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Client email">
                        <Input
                          type="email"
                          value={client.email}
                          onChange={(e) =>
                            setClient((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          placeholder="client@company.com"
                        />
                      </Field>
                      <Field label="GST / Tax ID">
                        <Input
                          value={client.taxId}
                          onChange={(e) =>
                            setClient((prev) => ({
                              ...prev,
                              taxId: e.target.value,
                            }))
                          }
                          placeholder="Client GSTIN"
                        />
                      </Field>
                    </div>

                    <Field label="Billing Address">
                      <div className="flex flex-col gap-2 mt-1">
                        <Input
                          value={client.address.line1}
                          onChange={(e) =>
                            setClient((prev: any) => ({
                              ...prev,
                              address: {
                                ...prev.address,
                                line1: e.target.value,
                              },
                            }))
                          }
                          placeholder="Line 1 (Street, House No.)"
                        />
                        <Input
                          value={client.address.line2}
                          onChange={(e) =>
                            setClient((prev: any) => ({
                              ...prev,
                              address: {
                                ...prev.address,
                                line2: e.target.value,
                              },
                            }))
                          }
                          placeholder="Line 2 (Apartment, Suite)"
                        />
                        <Input
                          value={client.address.line3}
                          onChange={(e) =>
                            setClient((prev: any) => ({
                              ...prev,
                              address: {
                                ...prev.address,
                                line3: e.target.value,
                              },
                            }))
                          }
                          placeholder="Line 3 (Area, Landmark)"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <Input
                            value={client.address.city}
                            onChange={(e) =>
                              setClient((prev: any) => ({
                                ...prev,
                                address: {
                                  ...prev.address,
                                  city: e.target.value,
                                },
                              }))
                            }
                            placeholder="City"
                          />
                          <Input
                            value={client.address.state}
                            onChange={(e) =>
                              setClient((prev: any) => ({
                                ...prev,
                                address: {
                                  ...prev.address,
                                  state: e.target.value,
                                },
                              }))
                            }
                            placeholder="State"
                          />
                          <Input
                            value={client.address.pincode}
                            onChange={(e) =>
                              setClient((prev: any) => ({
                                ...prev,
                                address: {
                                  ...prev.address,
                                  pincode: e.target.value,
                                },
                              }))
                            }
                            placeholder="Pincode"
                          />
                        </div>
                      </div>
                    </Field>

                    <label className="flex items-center gap-2 text-sm text-neutral-400">
                      <input
                        type="checkbox"
                        checked={saveClient}
                        onChange={(e) => setSaveClient(e.target.checked)}
                      />
                      Save to clients list
                    </label>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Client email">
                        <Input
                          type="email"
                          value={selectedClient?.email || ""}
                          disabled
                        />
                      </Field>
                      <Field label="GST / Tax ID">
                        <Input value={selectedClient?.taxId || ""} disabled />
                      </Field>
                    </div>

                    <Field label="Billing Address">
                      <div className="flex flex-col gap-3 mt-1 opacity-70 pointer-events-none">
                        <Input
                          value={selectedClient?.address?.line1 || ""}
                          readOnly
                          placeholder="Address Line 1 (Street, House No.)"
                        />
                        <Input
                          value={selectedClient?.address?.line2 || ""}
                          readOnly
                          placeholder="Address Line 2 (Apartment, Suite, Unit)"
                        />
                        <Input
                          value={selectedClient?.address?.line3 || ""}
                          readOnly
                          placeholder="Address Line 3 (Landmark, Area)"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Input
                            value={selectedClient?.address?.city || ""}
                            readOnly
                            placeholder="City"
                          />
                          <Input
                            value={selectedClient?.address?.state || ""}
                            readOnly
                            placeholder="State"
                          />
                          <Input
                            value={selectedClient?.address?.pincode || ""}
                            readOnly
                            placeholder="Pincode"
                          />
                        </div>
                      </div>
                    </Field>
                  </>
                )}
              </div>
            </div>
          </Section>

          <Section title="Line items" hint="Services, products, or milestones">
            <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="text-left">
                  <th className="text-xs uppercase tracking-widest text-neutral-500 pb-3 font-medium w-[38%]">
                    Description
                  </th>
                  <th className="text-xs uppercase tracking-widest text-neutral-500 pb-3 font-medium w-[10%]">
                    Qty
                  </th>
                  <th className="text-xs uppercase tracking-widest text-neutral-500 pb-3 font-medium w-[18%]">
                    Unit price
                  </th>
                  <th className="text-xs uppercase tracking-widest text-neutral-500 pb-3 font-medium w-[12%]">
                    Tax %
                  </th>
                  <th className="text-xs uppercase tracking-widest text-neutral-500 pb-3 font-medium w-[17%] text-right">
                    Amount
                  </th>
                  <th className="w-[5%]"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-800">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 pr-2">
                      <input
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600"
                        value={item.description}
                        onChange={(e) =>
                          updateItem(item.id, "description", e.target.value)
                        }
                        placeholder="Item description"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white text-right focus:outline-none focus:border-neutral-600"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(
                            item.id,
                            "quantity",
                            Number(e.target.value),
                          )
                        }
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white text-right focus:outline-none focus:border-neutral-600"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(
                            item.id,
                            "unitPrice",
                            Number(e.target.value),
                          )
                        }
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white text-right focus:outline-none focus:border-neutral-600"
                        value={item.taxPercent}
                        onChange={(e) =>
                          updateItem(
                            item.id,
                            "taxPercent",
                            Number(e.target.value),
                          )
                        }
                      />
                    </td>
                    <td className="py-2 pr-2 text-right text-sm font-medium tabular-nums">
                      ₹
                      {(
                        item.quantity *
                        item.unitPrice *
                        (1 + item.taxPercent / 100)
                      ).toLocaleString("en-IN")}
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-neutral-600 hover:text-red-400 transition-colors text-sm"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            <button
              onClick={addItem}
              className="mt-3 w-full border border-dashed border-neutral-700 rounded-lg py-2 text-sm text-neutral-500 hover:text-white hover:border-neutral-500 transition-all"
            >
              + Add line item
            </button>

            <div className="mt-4 flex flex-col gap-2 border-t border-neutral-800 pt-4">
              <TotalRow
                label="Subtotal"
                value={`₹${subtotal.toLocaleString("en-IN")}`}
              />
              <div className="w-full flex flex-row justify-between items-center text-sm text-neutral-400">
                <label htmlFor="discount">Discount %</label>
                <input
                  id="discount"
                  type="number"
                  min={0}
                  max={100}
                  className="w-20 bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-sm text-white text-right focus:outline-none focus:border-neutral-600"
                  value={discountPercentage}
                  onChange={(e) =>
                    setDiscountPercentage(
                      Math.min(100, Math.max(0, Number(e.target.value))),
                    )
                  }
                />
              </div>

              <TotalRow
                className="text-red-700"
                label={`Discount (${discountPercentage}%)`}
                value={`-₹${discountAmount.toLocaleString("en-IN")}`}
              />
              <TotalRow
                label="GST"
                value={`₹${taxTotal.toLocaleString("en-IN")}`}
              />
              <TotalRow
                label="Total"
                value={`₹${total.toLocaleString("en-IN")}`}
                bold
              />
            </div>
          </Section>

          <Section title="Notes & terms">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Client note">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Thank you for your business."
                />
              </Field>
              <Field label="Payment terms">
                <Textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                />
              </Field>
            </div>
          </Section>
        </div>

        <div className="  flex flex-col gap-4 sticky top-[73px]">
          <Panel title="Quotation details">
            <MetaField label="Quotation number">
              <input
                placeholder={quotationNumber}
                disabled
                className={`bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 w-full `}
              />
            </MetaField>
            <MetaField label="Issue date">
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </MetaField>
            <MetaField label="Due date">
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </MetaField>
            <MetaField label="Currency">
              <Select value={currency} onChange={setCurrency}>
                <option value="INR">₹ INR</option>
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
              </Select>
            </MetaField>
          </Panel>

          <Panel title="Summary">
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between text-neutral-400">
                <span>Subtotal</span>
                <span className="tabular-nums">
                  ₹{subtotal.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>GST</span>
                <span className="tabular-nums">
                  ₹{taxTotal.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between font-medium text-white border-t border-neutral-800 pt-2 mt-1">
                <span>Total</span>
                <span className="tabular-nums">
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <PillButton
                className="w-full h-fit"
                onClickFunction={() => handleSubmit("DRAFT")}
                arrow={true}
                title={isEditMode ? "Update Draft" : "Save Draft"}
                disabled={submitting}
              />
              <PillButton
                className="w-full h-fit"
                onClickFunction={() => handleSubmit("SENT")}
                arrow={true}
                title={isEditMode ? "Update Quotation" : "Send Quotation"}
                disabled={submitting}
                varient=""
              />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800/60">
        <h3 className="text-base font-light">{title}</h3>
        {hint && <span className="text-base text-neutral-500">{hint}</span>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-800/60">
        <h4 className="text-base font-light">{title}</h4>
      </div>
      <div className="p-4 flex flex-col gap-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-neutral-500">{label}</label>
      {children}
    </div>
  );
}

function MetaField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-neutral-500 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 w-full ${className}`}
      {...props}
    />
  );
}

function Textarea({
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={3}
      className={`bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 w-full resize-none ${className}`}
      {...props}
    />
  );
}

function Select({
  children,
  value,
  onChange,
}: {
  children: React.ReactNode;
  value?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-600 w-full cursor-pointer"
    >
      {children}
    </select>
  );
}

function TotalRow({
  label,
  value,
  bold = false,
  className,
}: {
  label: string;
  value: string;
  bold?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex justify-between text-sm ${bold ? "font-semibold text-white border-t border-neutral-800 pt-2 mt-1" : "text-neutral-400"}`}
    >
      <span>{label}</span>
      <span className={`${className} tabular-nums`}>{value}</span>
    </div>
  );
}
