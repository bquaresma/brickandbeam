import { describe, expect, it } from "vitest";

import { parseRooms, parseSection } from "./schema";

describe("parseSection", () => {
  it("accepts catalog answers and strips anything else", () => {
    const result = parseSection("kitchen", {
      range: "gas",
      dishwasher: "hookup",
      rangeHookups: ["gas-line", "240v"],
      notes: "  Sloping floor  ",
      notInTheCatalog: "ignored",
    });
    expect(result).toEqual({
      ok: true,
      value: {
        range: "gas",
        dishwasher: "hookup",
        rangeHookups: ["gas-line", "240v"],
        notes: "Sloping floor",
      },
    });
  });

  it("rejects an answer the catalog doesn't offer, naming the question", () => {
    const result = parseSection("kitchen", { range: "wood-fired" });
    expect(result).toEqual({ ok: false, error: "Check “Range”." });
  });

  it("treats blank answers as unanswered", () => {
    const result = parseSection("kitchen", {
      range: "",
      size: "",
      rangeHookups: [],
      notes: null,
    });
    expect(result).toEqual({ ok: true, value: {} });
  });

  it("allows free-text tags only where the catalog says so", () => {
    expect(
      parseSection("character", { features: ["hardwood", "a dumbwaiter!"] }).ok,
    ).toBe(true);
    expect(parseSection("basement", { access: ["interior-stairs", "made-up"] }).ok).toBe(
      false,
    );
  });

  it("enforces numeric ranges and whole numbers", () => {
    expect(parseSection("basement", { moistureYear: 2019 }).ok).toBe(true);
    expect(parseSection("basement", { moistureYear: 1200 }).ok).toBe(false);
    expect(parseSection("basement", { moistureYear: 2019.5 }).ok).toBe(false);
  });

  it("handles repeatable sections as arrays and requires an id per entry", () => {
    const ok = parseSection("bathrooms", [
      { id: "b1", name: "Upstairs bath", tub: "clawfoot", outlet: "none" },
    ]);
    expect(ok).toEqual({
      ok: true,
      value: [{ id: "b1", name: "Upstairs bath", tub: "clawfoot", outlet: "none" }],
    });
    expect(parseSection("bathrooms", [{ tub: "clawfoot" }]).ok).toBe(false);
    expect(parseSection("bathrooms", { tub: "clawfoot" }).ok).toBe(false);
    expect(parseSection("bathrooms", [])).toEqual({ ok: true, value: [] });
  });
});

describe("parseRooms", () => {
  it("validates rooms and requires a name", () => {
    expect(
      parseRooms([
        {
          id: "r1",
          name: "Attic suite",
          type: "non-conforming-bedroom",
          level: "Attic",
          lengthFt: 11,
          widthFt: 14,
          countsAsBedroom: "no",
        },
      ]).ok,
    ).toBe(true);
    expect(parseRooms([{ id: "r1", name: "   " }]).ok).toBe(false);
    expect(parseRooms([{ id: "r1", name: "Den", type: "spaceship" }]).ok).toBe(false);
    expect(parseRooms([{ id: "r1", name: "Den", lengthFt: -3 }]).ok).toBe(false);
  });
});
