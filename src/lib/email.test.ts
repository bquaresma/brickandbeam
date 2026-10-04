import { describe, expect, it } from "vitest";

import { EMAIL_RE, normalizeEmail } from "./email";

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  Brian@Example.COM ")).toBe("brian@example.com");
  });

  it("returns an empty string for non-strings", () => {
    expect(normalizeEmail(undefined)).toBe("");
    expect(normalizeEmail(null)).toBe("");
    expect(normalizeEmail(42)).toBe("");
  });
});

describe("EMAIL_RE", () => {
  it("accepts ordinary addresses and rejects obvious junk", () => {
    expect(EMAIL_RE.test("a@b.co")).toBe(true);
    expect(EMAIL_RE.test("no-at-sign")).toBe(false);
    expect(EMAIL_RE.test("a b@c.com")).toBe(false);
    expect(EMAIL_RE.test("a@b")).toBe(false);
  });
});
