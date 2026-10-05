import { afterEach, describe, expect, it } from "vitest";

import { isAdminEmail } from "../admin";
import { ROOM_FIELDS, SECTIONS, SECTION_BY_KEY } from "./catalog";
import {
  catalogSnippet,
  parseOptionLines,
  parseQuestionDefinition,
  roomQuestionFields,
  withCustomFields,
  type QuestionRecord,
} from "./custom";
import {
  derivedSpaces,
  groupSections,
  highlights,
  publicSections,
  roomExtraFields,
  roomExtraLines,
} from "./format";
import { parseFacts, parseRooms, parseSection } from "./schema";

const bikeStorage: QuestionRecord = {
  key: "x_aaaaaaaaaa",
  label: "Bike storage",
  type: "TRI",
  section: "outdoors",
};
const roofType: QuestionRecord = {
  key: "x_bbbbbbbbbb",
  label: "Roof type",
  type: "SELECT",
  options: [
    { value: "slate", label: "Slate" },
    { value: "tar", label: "Tar and gravel" },
  ],
  section: "upkeep",
};
const wallArea: QuestionRecord = {
  key: "x_cccccccccc",
  label: "Wall area",
  type: "NUMBER",
  unit: "sq ft",
  section: "rooms",
};

describe("the built-in catalog", () => {
  it("has unique section keys and unique field keys inside each section", () => {
    expect(new Set(SECTIONS.map((s) => s.key)).size).toBe(SECTIONS.length);
    for (const section of SECTIONS) {
      const keys = section.fields.map((f) => f.key);
      expect(new Set(keys).size, section.key).toBe(keys.length);
    }
    const roomKeys = ROOM_FIELDS.map((f) => f.key);
    expect(new Set(roomKeys).size).toBe(roomKeys.length);
  });

  it("gives every choice question at least two distinct options", () => {
    for (const field of [...SECTIONS.flatMap((s) => s.fields), ...ROOM_FIELDS]) {
      if (field.type !== "select" && field.type !== "tags") continue;
      const values = field.options.map((o) => o.value);
      expect(values.length, field.key).toBeGreaterThanOrEqual(2);
      expect(new Set(values).size, field.key).toBe(values.length);
    }
  });

  it("reserves the x_ prefix for landlord-defined questions", () => {
    for (const field of [...SECTIONS.flatMap((s) => s.fields), ...ROOM_FIELDS]) {
      expect(field.key.startsWith("x_")).toBe(false);
    }
  });

  it("includes the technology, energy and upkeep questions", () => {
    const keys = (section: string) =>
      SECTION_BY_KEY[section as keyof typeof SECTION_BY_KEY].fields.map((f) => f.key);
    expect(keys("tech")).toEqual(
      expect.arrayContaining(["lockType", "cameras", "doorbell", "internet"]),
    );
    expect(keys("energy")).toEqual(
      expect.arrayContaining(["evCharging", "solar", "battery"]),
    );
    expect(keys("upkeep")).toEqual(expect.arrayContaining(["pestHistory", "snow"]));
  });
});

describe("parseOptionLines", () => {
  it("makes stable, unique values from labels", () => {
    expect(parseOptionLines("Slate\nTar and gravel,  Slate ")).toEqual([
      { value: "slate", label: "Slate" },
      { value: "tar-and-gravel", label: "Tar and gravel" },
      { value: "slate-2", label: "Slate" },
    ]);
  });
});

describe("parseQuestionDefinition", () => {
  it("accepts a good question and normalizes it", () => {
    const result = parseQuestionDefinition({
      label: "  Roof type ",
      type: "SELECT",
      optionsText: "Slate\nTar and gravel",
      section: "upkeep",
      unit: "ignored",
    });
    expect(result).toEqual({
      ok: true,
      value: {
        label: "Roof type",
        help: null,
        type: "SELECT",
        options: [
          { value: "slate", label: "Slate" },
          { value: "tar-and-gravel", label: "Tar and gravel" },
        ],
        unit: null,
        section: "upkeep",
      },
    });
  });

  it("keeps a unit only for numbers, and allows the per-room scope", () => {
    const result = parseQuestionDefinition({
      label: "Wall area",
      type: "NUMBER",
      unit: "sq ft",
      section: "rooms",
    });
    expect(result.ok && result.value.unit).toBe("sq ft");
    expect(result.ok && result.value.section).toBe("rooms");
  });

  it("rejects bad input with a plain message", () => {
    expect(
      parseQuestionDefinition({ label: "Hi", type: "TRI", section: "kitchen" }),
    ).toMatchObject({ ok: false });
    expect(
      parseQuestionDefinition({
        label: "Roof type",
        type: "SELECT",
        optionsText: "Only one",
        section: "upkeep",
      }),
    ).toEqual({
      ok: false,
      error: "List at least two choices, one per line.",
    });
    expect(
      parseQuestionDefinition({ label: "Roof type", type: "TRI", section: "nonsense" })
        .ok,
    ).toBe(false);
    expect(
      parseQuestionDefinition({ label: "Roof type", type: "WEIRD", section: "kitchen" })
        .ok,
    ).toBe(false);
  });
});

describe("withCustomFields", () => {
  it("adds a question to its own section, before the notes field", () => {
    const merged = withCustomFields(SECTION_BY_KEY.outdoors, [bikeStorage, roofType]);
    const keys = merged.fields.map((f) => f.key);
    expect(keys).toContain("x_aaaaaaaaaa");
    expect(keys).not.toContain("x_bbbbbbbbbb"); // belongs to upkeep
    expect(keys.indexOf("x_aaaaaaaaaa")).toBe(keys.indexOf("notes") - 1);
  });

  it("never shows a question twice once it has graduated into the catalog", () => {
    const graduated: QuestionRecord = { ...bikeStorage, key: "porch" };
    const merged = withCustomFields(SECTION_BY_KEY.outdoors, [graduated]);
    expect(merged.fields.filter((f) => f.key === "porch")).toHaveLength(1);
  });

  it("returns the section untouched when nothing applies", () => {
    expect(withCustomFields(SECTION_BY_KEY.kitchen, [bikeStorage])).toBe(
      SECTION_BY_KEY.kitchen,
    );
  });
});

describe("custom answers", () => {
  it("are validated and kept only when the question is visible", () => {
    const withQuestion = parseSection("outdoors", { porch: "yes", x_aaaaaaaaaa: "yes" }, [
      bikeStorage,
    ]);
    expect(withQuestion).toEqual({
      ok: true,
      value: { porch: "yes", x_aaaaaaaaaa: "yes" },
    });

    const without = parseSection("outdoors", { porch: "yes", x_aaaaaaaaaa: "yes" });
    expect(without).toEqual({ ok: true, value: { porch: "yes" } });

    expect(parseSection("upkeep", { x_bbbbbbbbbb: "thatch" }, [roofType]).ok).toBe(false);
    expect(parseSection("upkeep", { x_bbbbbbbbbb: "slate" }, [roofType]).ok).toBe(true);
  });

  it("works for per-room questions, including decimals", () => {
    const rooms = parseRooms(
      [{ id: "r1", name: "Attic", x_cccccccccc: 112.5 }],
      [wallArea],
    );
    expect(rooms).toMatchObject({
      ok: true,
      value: [{ id: "r1", name: "Attic", x_cccccccccc: 112.5 }],
    });
    const stripped = parseRooms([{ id: "r1", name: "Attic", x_cccccccccc: 112.5 }]);
    expect(stripped).toMatchObject({ ok: true, value: [{ id: "r1", name: "Attic" }] });
  });

  it("show on the public page, and 'Not sure' never does", () => {
    const sections = publicSections(
      {
        version: 1,
        outdoors: { x_aaaaaaaaaa: "yes", porch: "unsure" },
        upkeep: { x_bbbbbbbbbb: "slate" },
      },
      [bikeStorage, roofType],
    );
    const text = JSON.stringify(sections);
    expect(text).toContain("Bike storage");
    expect(text).toContain("Roof type");
    expect(text).toContain("Slate");
    expect(text).not.toMatch(/unsure|not sure/i);
  });
});

describe("facts", () => {
  it("validate and appear under 'More about the house'", () => {
    const facts = parseFacts([{ id: "f1", label: "Internet", value: "Fiber available" }]);
    expect(facts.ok).toBe(true);
    expect(parseFacts([{ id: "f1", label: "", value: "x" }]).ok).toBe(false);

    const sections = publicSections({
      version: 1,
      facts: [{ id: "f1", label: "Internet", value: "Fiber available" }],
    });
    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBe("More about the house");
    expect(sections[0].blocks[0].lines).toEqual([
      { label: "Internet", text: "Fiber available" },
    ]);
  });
});

describe("room extras", () => {
  it("list answered extras only", () => {
    const fields = roomExtraFields([...ROOM_FIELDS, ...roomQuestionFields([wallArea])]);
    expect(fields.map((f) => f.key)).toEqual([
      "roomHeat",
      "ceilingFan",
      "ethernetJack",
      "x_cccccccccc",
    ]);

    const lines = roomExtraLines(
      {
        id: "r1",
        name: "Attic",
        roomHeat: "radiator",
        ceilingFan: "unsure",
        x_cccccccccc: 40,
      } as never,
      fields,
    );
    expect(lines).toEqual([
      { label: "Heat in this room", text: "Radiator" },
      { label: "Wall area", text: "40 sq ft" },
    ]);
  });
});

describe("catalogSnippet", () => {
  it("keeps the key so stored answers carry over", () => {
    const snippet = catalogSnippet(roofType);
    expect(snippet).toContain('key: "x_bbbbbbbbbb"');
    expect(snippet).toContain('opts(["slate", "Slate"], ["tar", "Tar and gravel"])');
    expect(snippet).toContain(`"upkeep" section`);
    expect(catalogSnippet(wallArea)).toContain("ROOM_FIELDS");
  });
});

describe("isAdminEmail", () => {
  const original = process.env.ADMIN_EMAILS;
  afterEach(() => {
    process.env.ADMIN_EMAILS = original;
  });

  it("matches the configured emails, ignoring case and spacing", () => {
    process.env.ADMIN_EMAILS = " Brian@Example.com , other@example.com ";
    expect(isAdminEmail("brian@example.com")).toBe(true);
    expect(isAdminEmail("OTHER@example.com")).toBe(true);
    expect(isAdminEmail("someone@example.com")).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
  });

  it("grants nobody access when unset", () => {
    process.env.ADMIN_EMAILS = "";
    expect(isAdminEmail("brian@example.com")).toBe(false);
  });
});

describe("derivedSpaces", () => {
  const rooms = [{ id: "r1", name: "Kitchen", level: "First floor" }];

  it("puts each bathroom on its own floor", () => {
    const spaces = derivedSpaces(
      {
        version: 1,
        bathrooms: [
          {
            id: "a",
            name: "Upstairs bath",
            level: "Second floor",
            tub: "clawfoot",
            outlet: "none",
          },
          { id: "b", type: "half" },
        ],
      },
      rooms,
    );
    expect(spaces.map((s) => [s.name, s.level])).toEqual([
      ["Upstairs bath", "Second floor"],
      ["Bathroom 2", ""],
    ]);
    expect(spaces[0].lines.map((l) => l.label)).toEqual(["Tub", "Outlets"]); // not "Floor"
  });

  it("includes the basement, with its laundry, when there is one", () => {
    const [basement] = derivedSpaces(
      {
        version: 1,
        basement: {
          type: "full",
          finish: "unfinished",
          headClearance: "About 7 ft",
          floor: "stone",
        },
        laundry: { location: "basement" },
      },
      rooms,
    );
    expect(basement).toMatchObject({
      name: "Basement",
      level: "Basement",
      kind: "basement",
    });
    const labels = basement.lines.map((l) => l.label);
    expect(labels).toEqual(["Type", "Finish", "Head clearance", "Laundry"]); // a summary, not every answer
  });

  it("leaves the basement out when there isn't one or the landlord already listed it", () => {
    expect(derivedSpaces({ version: 1, basement: { type: "none" } }, rooms)).toEqual([]);
    expect(derivedSpaces({ version: 1 }, rooms)).toEqual([]);
    expect(derivedSpaces(null, rooms)).toEqual([]);
    const listed = [...rooms, { id: "r2", name: "Cellar workshop", level: "Basement" }];
    expect(derivedSpaces({ version: 1, basement: { type: "full" } }, listed)).toEqual([]);
  });

  it("never carries a 'Not sure' answer", () => {
    const text = JSON.stringify(
      derivedSpaces(
        {
          version: 1,
          bathrooms: [{ id: "a", tub: "unsure", ventilation: "fan" }],
          basement: { type: "full", finish: "unsure" },
        },
        rooms,
      ),
    );
    expect(text).not.toMatch(/unsure|not sure/i);
  });
});

describe("highlights", () => {
  it("picks the facts a renter scans for, and the honest quirks", () => {
    const g = highlights({
      version: 1,
      character: {
        features: ["hardwood", "pocket-doors"],
        fireplace: "working",
        quirks: ["steep-stairs"],
        partyWall: "yes",
      },
      bathrooms: [{ id: "a", tub: "clawfoot" }],
      kitchen: { range: "gas" },
      systems: { heat: "steam" },
      basement: { type: "full", finish: "unfinished" },
      energy: { evCharging: "outlet-240" },
      tech: { lockType: "smart", internet: ["cable", "fiber"] },
      outdoors: { porch: "yes" },
    });
    expect(g.highlights).toEqual([
      "Original hardwood or pine floors",
      "Pocket doors",
      "Working fireplace",
      "Claw-foot tub",
      "Gas range",
      "Steam heat",
      "Full basement",
      "EV charging",
      "Smart lock",
      "Fiber internet",
    ]);
    expect(g.quirks).toEqual([
      "Steep or narrow stairs",
      "Shares a wall with the neighbor",
    ]);
  });

  it("says finished when the basement is finished, and caps the list at ten", () => {
    expect(
      highlights({ version: 1, basement: { type: "full", finish: "finished" } })
        .highlights,
    ).toEqual(["Finished basement"]);
    const many = highlights({
      version: 1,
      character: { features: ["hardwood", "plaster", "crown", "x1"] },
      kitchen: { range: "gas" },
      systems: { heat: "forced-air" },
      basement: { type: "full" },
      energy: { evCharging: "charger", solar: "owned" },
      tech: { lockType: "smart", internet: ["fiber"] },
      outdoors: { porch: "yes", yard: "fenced" },
      laundry: { location: "basement", washerHookup: "yes" },
    });
    expect(many.highlights.length).toBeLessThanOrEqual(10);
  });

  it("ignores 'Not sure', none, and nothing at all", () => {
    expect(highlights(null)).toEqual({ highlights: [], quirks: [] });
    const g = highlights({
      version: 1,
      kitchen: { range: "none" },
      energy: { evCharging: "none", solar: "none" },
      basement: { type: "none" },
      systems: { heatFuel: "unsure" },
    });
    expect(g.highlights).toEqual([]);
  });
});

describe("groupSections", () => {
  it("collapses sections into four themed groups and drops empty ones", () => {
    const sections = publicSections({
      version: 1,
      kitchen: { range: "gas", dishwasher: "no" },
      basement: { type: "full" },
      systems: { heat: "steam" },
      outdoors: { porch: "yes" },
    });
    const groups = groupSections(sections);
    expect(groups.map((g) => g.title)).toEqual([
      "Inside the house",
      "Systems, energy and tech",
      "Living here",
    ]);
    expect(groups[0].count).toBe(3);
    expect(groups[0].sections.map((s) => s.title)).toEqual(["Kitchen", "Basement"]);
  });

  it("opens the first group and 'Good to know' by default", () => {
    const groups = groupSections(
      publicSections({
        version: 1,
        kitchen: { range: "gas" },
        systems: { heat: "steam" },
        knownConditions: { items: ["water"] },
      }),
    );
    expect(groups.map((g) => [g.key, g.open])).toEqual([
      ["inside", true],
      ["systems", false],
      ["good", true],
    ]);
  });
});
