export type ItemInput = {
  description: string;
  quantity: number;
  unitPrice: number;
  taxPercent?: number;
};

export const normalize = (value?: string | null) => value?.trim() || null;

export const round2 = (num: number) =>
  Math.round((num + Number.EPSILON) * 100) / 100;

export const formatCurrency = (amount: number, currency: string = "INR") => {
  const locale = currency === "INR" ? "en-IN" : "en-US";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
    }).format(amount);
  } catch {
    return `${currency} ${Number(amount).toFixed(2)}`;
  }
};

export const calculateTotals = (items: ItemInput[], discount: number) => {
  const validDiscount = Math.min(100, Math.max(0, Number(discount) || 0));
  const discountFactor = 1 - validDiscount / 100;

  const subtotal = round2(
    items.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
      0,
    ),
  );

  const discountedAmount = round2((subtotal * validDiscount) / 100);
  const discountedSubtotal = round2(subtotal - discountedAmount);

  const taxTotal = round2(
    items.reduce((sum, item) => {
      const lineBase = Number(item.quantity) * Number(item.unitPrice);
      const discountedLineBase = lineBase * discountFactor;
      return sum + (discountedLineBase * Number(item.taxPercent || 0)) / 100;
    }, 0),
  );

  return {
    subtotal,
    taxTotal,
    total: round2(discountedSubtotal + taxTotal),
  };
};
