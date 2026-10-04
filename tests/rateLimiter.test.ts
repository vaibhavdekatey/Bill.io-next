import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { RateLimiter, getClientIp } from "@/lib/rate-limiter";

describe("RateLimiter", () => {
  it("allows requests within the limit", () => {
    const limiter = new RateLimiter({ windowMs: 1000, max: 3 });
    const key = "test-user-1";

    const res1 = limiter.check(key);
    assert.equal(res1.allowed, true);
    assert.equal(res1.remaining, 2);

    const res2 = limiter.check(key);
    assert.equal(res2.allowed, true);
    assert.equal(res2.remaining, 1);

    const res3 = limiter.check(key);
    assert.equal(res3.allowed, true);
    assert.equal(res3.remaining, 0);
  });

  it("blocks requests that exceed the limit", () => {
    const limiter = new RateLimiter({ windowMs: 1000, max: 2 });
    const key = "test-user-2";

    limiter.check(key);
    limiter.check(key);

    const resBlocked = limiter.check(key);
    assert.equal(resBlocked.allowed, false);
    assert.equal(resBlocked.remaining, 0);
  });

  it("tracks different keys independently", () => {
    const limiter = new RateLimiter({ windowMs: 1000, max: 2 });
    limiter.check("ip-1");
    limiter.check("ip-1");

    assert.equal(limiter.check("ip-1").allowed, false);
    assert.equal(limiter.check("ip-2").allowed, true);
  });

  it("resets limits after the window expires", async () => {
    const limiter = new RateLimiter({ windowMs: 50, max: 1 });
    const key = "test-expiry";

    assert.equal(limiter.check(key).allowed, true);
    assert.equal(limiter.check(key).allowed, false);

    // Wait 60ms for window to expire
    await new Promise((resolve) => setTimeout(resolve, 60));

    const resAfter = limiter.check(key);
    assert.equal(resAfter.allowed, true);
    assert.equal(resAfter.remaining, 0);
  });
});

describe("getClientIp", () => {
  it("extracts IP from x-forwarded-for header", () => {
    const req = new Request("http://localhost/api/test", {
      headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18" },
    });
    assert.equal(getClientIp(req), "203.0.113.195");
  });

  it("extracts IP from x-real-ip header if x-forwarded-for is missing", () => {
    const req = new Request("http://localhost/api/test", {
      headers: { "x-real-ip": "198.51.100.4" },
    });
    assert.equal(getClientIp(req), "198.51.100.4");
  });

  it("falls back to 127.0.0.1 if no headers are present", () => {
    const req = new Request("http://localhost/api/test");
    assert.equal(getClientIp(req), "127.0.0.1");
  });
});
