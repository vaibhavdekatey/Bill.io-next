import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateShareToken } from "@/lib/utils/helperFunctions";

describe("generateShareToken", () => {
  it("generates a 32-character hexadecimal string", () => {
    const token = generateShareToken();
    assert.equal(typeof token, "string");
    assert.equal(token.length, 32);
    assert.match(token, /^[0-9a-f]{32}$/);
  });

  it("generates distinct unique tokens across successive calls", () => {
    const tokenA = generateShareToken();
    const tokenB = generateShareToken();
    assert.notEqual(tokenA, tokenB);
  });
});
