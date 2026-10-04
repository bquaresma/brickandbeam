import { describe, expect, it } from "vitest";

import { requiresLeadPaintDisclosure } from "./compliance";

describe("requiresLeadPaintDisclosure", () => {
  it("applies to anything built before 1978", () => {
    expect(requiresLeadPaintDisclosure(1900)).toBe(true);
    expect(requiresLeadPaintDisclosure(1977)).toBe(true);
  });

  it("does not apply from 1978 on", () => {
    expect(requiresLeadPaintDisclosure(1978)).toBe(false);
    expect(requiresLeadPaintDisclosure(2020)).toBe(false);
  });
});
