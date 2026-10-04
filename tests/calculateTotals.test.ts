import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateTotals, formatCurrency, round2 } from "@/lib/utils/calculations";

describe("calculateTotals", () => {
  it("calculates subtotal, taxTotal, and total correctly without discount", () => {
    const items = [
      { description: "Item 1", quantity: 2, unitPrice: 100, taxPercent: 18 },
      { description: "Item 2", quantity: 1, unitPrice: 50, taxPercent: 0 },
    ];
    const discount = 0;

    const result = calculateTotals(items, discount);

    assert.equal(result.subtotal, 250);
    assert.equal(result.taxTotal, 36);
    assert.equal(result.total, 286);
  });

  it("calculates tax on discounted amount when a general discount is applied", () => {
    // Subtotal = 100 * 2 = 200.
    // 10% discount => discount amount = 20, discounted subtotal = 180.
    // Tax at 18% on discounted base of 180 = 32.40.
    // Total = 180 + 32.40 = 212.40.
    // (Under buggy behavior, tax was computed on 200 => 36, and total was 216).
    const items = [
      { description: "Web Development", quantity: 2, unitPrice: 100, taxPercent: 18 },
    ];
    const discount = 10;

    const result = calculateTotals(items, discount);

    assert.equal(result.subtotal, 200);
    assert.equal(result.taxTotal, 32.4);
    assert.equal(result.total, 212.4);
  });

  it("handles mixed items with different tax rates under discount and rounds properly", () => {
    // Item 1: 1 * 100, tax 10%
    // Item 2: 2 * 50 = 100, tax 5%
    // Subtotal = 200.
    // Discount 20% => factor = 0.8.
    // Item 1 discounted base = 80, tax = 8.
    // Item 2 discounted base = 80, tax = 4.
    // Tax total = 12.
    // Total = 160 + 12 = 172.
    const items = [
      { description: "Product A", quantity: 1, unitPrice: 100, taxPercent: 10 },
      { description: "Product B", quantity: 2, unitPrice: 50, taxPercent: 5 },
    ];
    const discount = 20;

    const result = calculateTotals(items, discount);

    assert.equal(result.subtotal, 200);
    assert.equal(result.taxTotal, 12);
    assert.equal(result.total, 172);
  });
});

describe("round2", () => {
  it("rounds numbers accurately to 2 decimal places", () => {
    assert.equal(round2(10.555), 10.56);
    assert.equal(round2(10.554), 10.55);
    assert.equal(round2(10), 10);
  });
});

describe("formatCurrency", () => {
  it("formats INR and USD correctly", () => {
    const inr = formatCurrency(1250, "INR");
    assert.ok(inr.includes("1,250") || inr.includes("₹"));

    const usd = formatCurrency(1250, "USD");
    assert.ok(usd.includes("1,250") || usd.includes("$"));
  });
});

