import { describe, expect, it } from "vitest";

import { SECTION_BY_KEY } from "./catalog";
import { publicSections, progress, roomLegend } from "./format";
import type { Details } from "./schema";

describe("publicSections", () => {
  it("never shows 'Not sure' answers, in any field type", () => {
    const details: Details = {
      version: 1,
      kitchen: { range: "gas", gfci: "unsure", dishwasher: "no" },
      systems: { heatFuel: "unsure", electricAmps: "unsure", heat: "steam" },
    };
    const text = JSON.stringify(publicSections(details));
    expect(text).not.toMatch(/not sure|unsure/i);
    expect(text).toContain("Gas");
    expect(text).toContain("Steam radiators");
  });

  it("shows plain Yes and No answers", () => {
    const sections = publicSections({
      version: 1,
      outdoors: { porch: "yes", deck: "no" },
    });
    const lines = sections[0].blocks[0].lines;
    expect(lines).toEqual([
      { label: "Porch", text: "Yes", multiline: false },
      { label: "Deck or patio", text: "No", multiline: false },
    ]);
  });

  it("omits sections with nothing to say, and handles no details at all", () => {
    expect(publicSections(null)).toEqual([]);
    expect(
      publicSections({ version: 1, kitchen: { gfci: "unsure" }, laundry: {} }),
    ).toEqual([]);
  });

  it("titles each bathroom and drops its unanswered fields", () => {
    const sections = publicSections({
      version: 1,
      bathrooms: [
        {
          id: "a",
          name: "Upstairs bath",
          tub: "clawfoot",
          ventilation: "window",
          outlet: "none",
        },
        { id: "b", level: "First floor", type: "half" },
        { id: "c", tub: "unsure" },
      ],
    });
    const blocks = sections[0].blocks;
    expect(blocks.map((b) => b.title)).toEqual(["Upstairs bath", "First floor bathroom"]);
    expect(blocks[0].lines.map((l) => l.label)).toEqual([
      "Tub",
      "Ventilation",
      "Outlets",
    ]);
  });

  it("labels tags from the catalog and passes custom ones through", () => {
    const sections = publicSections({
      version: 1,
      character: { features: ["hardwood", "a very old dumbwaiter"] },
    });
    expect(sections[0].blocks[0].lines[0].text).toBe(
      "Original hardwood or pine floors, a very old dumbwaiter",
    );
  });
});

describe("progress", () => {
  it("counts 'Not sure' as an open item, not as answered", () => {
    const p = progress(SECTION_BY_KEY.kitchen, {
      range: "gas",
      gfci: "unsure",
      notes: "x",
    });
    expect(p.answered).toBe(1);
    expect(p.open).toBe(1);
    expect(p.total).toBe(SECTION_BY_KEY.kitchen.fields.length - 1); // notes excluded
  });

  it("treats bathrooms as answered once one exists", () => {
    expect(progress(SECTION_BY_KEY.bathrooms, undefined)).toEqual({
      answered: 0,
      total: 1,
      open: 0,
    });
    expect(progress(SECTION_BY_KEY.bathrooms, [{ id: "a", tub: "unsure" }])).toEqual({
      answered: 1,
      total: 1,
      open: 1,
    });
  });
});

describe("roomLegend", () => {
  it("joins marker, name and size", () => {
    expect(
      roomLegend({ id: "1", name: "Kitchen", marker: "A", lengthFt: 11, widthFt: 14 }),
    ).toBe("A · Kitchen — 11 × 14 ft");
    expect(roomLegend({ id: "2", name: "Attic" })).toBe("Attic");
  });
});
