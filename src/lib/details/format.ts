import {
  SECTIONS,
  SECTION_BY_KEY,
  UNSURE,
  type Field,
  type Section,
  type SectionKey,
} from "./catalog";
import { withCustomFields, type QuestionRecord } from "./custom";
import type { Details, Room, SectionValue } from "./schema";

export type Line = { label: string; text: string; multiline?: boolean };

// Is this follow-up question currently relevant, given the other answers?
export function isVisible(field: Field, entry: SectionValue): boolean {
  return !field.showIf || field.showIf.in.includes(String(entry[field.showIf.key]));
}

// Drops answers to follow-ups that no longer apply (changing "Range" away from
// "none" retires the hookup question and its answer). Repeats until stable, in
// case one follow-up gates another.
export function pruneHidden(fields: Field[], entry: SectionValue): SectionValue {
  let current = entry;
  for (let pass = 0; pass < fields.length; pass++) {
    const stale = fields.filter(
      (f) => !isVisible(f, current) && current[f.key] !== undefined,
    );
    if (stale.length === 0) return current;
    current = { ...current };
    for (const f of stale) delete current[f.key];
  }
  return current;
}

const labelOf = (field: Field, value: string) =>
  field.type === "select" || field.type === "tags"
    ? (field.options.find((o) => o.value === value)?.label ?? value)
    : value;

// How one answer reads on the public page. Returns null for anything that
// shouldn't appear: unanswered, empty, and above all "Not sure".
export function describe(field: Field, value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  switch (field.type) {
    case "tri":
      return value === "yes" ? "Yes" : value === "no" ? "No" : null;
    case "select":
      return value === UNSURE ? null : labelOf(field, String(value));
    case "tags": {
      const items = (Array.isArray(value) ? value : []).map((v) =>
        labelOf(field, String(v)),
      );
      return items.length ? items.join(", ") : null;
    }
    case "number":
      return field.unit === "year"
        ? String(value)
        : `${value}${field.unit ? ` ${field.unit}` : ""}`;
    case "text":
      return String(value).trim() || null;
  }
}

export function entryLines(section: Section, value: SectionValue): Line[] {
  const lines: Line[] = [];
  for (const field of section.fields) {
    if (!isVisible(field, value)) continue;
    const text = describe(field, value[field.key]);
    if (text)
      lines.push({
        label: field.label,
        text,
        multiline: field.type === "text" && field.multiline,
      });
  }
  return lines;
}

export function bathroomTitle(entry: SectionValue, index: number): string {
  if (typeof entry.name === "string" && entry.name) return entry.name;
  if (typeof entry.level === "string" && entry.level) return `${entry.level} bathroom`;
  return `Bathroom ${index + 1}`;
}

export type PublicSection = {
  key: SectionKey;
  title: string;
  // One block per bathroom; a single block for everything else.
  blocks: { title?: string; lines: Line[] }[];
};

// Everything the public page shows, already filtered. A section with nothing
// to say is omitted entirely. `questions` are the custom questions visible to
// the landlord, so their answers show too; free-form facts join "More about
// the house".
export function publicSections(
  details: Details | null | undefined,
  questions: QuestionRecord[] = [],
): PublicSection[] {
  if (!details) return [];
  const out: PublicSection[] = [];
  for (const base of SECTIONS) {
    const section = withCustomFields(base, questions);
    const raw = details[section.key];
    const entries = raw
      ? section.repeatable
        ? (raw as SectionValue[])
        : [raw as SectionValue]
      : [];
    const blocks = entries
      .map((entry, i) => ({
        title: section.repeatable ? bathroomTitle(entry, i) : undefined,
        lines: entryLines(section, entry),
      }))
      .filter((b) => b.lines.length > 0);

    if (section.key === "general" && details.facts?.length) {
      const factLines = details.facts.map((f) => ({ label: f.label, text: f.value }));
      if (blocks.length) blocks[0].lines.push(...factLines);
      else blocks.push({ title: undefined, lines: factLines });
    }
    if (blocks.length) out.push({ key: section.key, title: section.title, blocks });
  }
  return out;
}

export type Progress = { answered: number; total: number; open: number };

// For the landlord's completeness meter. "Not sure" counts as an open item,
// not as answered. Free-text notes don't count toward the total.
export function progress(
  section: Section,
  raw: SectionValue | SectionValue[] | undefined,
): Progress {
  if (section.repeatable) {
    const entries = (raw as SectionValue[] | undefined) ?? [];
    return {
      answered: entries.length > 0 ? 1 : 0,
      total: 1,
      open: entries.reduce((n, e) => n + countOpen(section, e), 0),
    };
  }
  const value = (raw as SectionValue | undefined) ?? {};
  const counted = section.fields.filter((f) => f.key !== "notes" && isVisible(f, value));
  return {
    answered: counted.filter((f) => describe(f, value[f.key]) !== null).length,
    total: counted.length,
    open: countOpen(section, value),
  };
}

function countOpen(section: Section, value: SectionValue) {
  return section.fields.filter((f) => isVisible(f, value) && value[f.key] === UNSURE)
    .length;
}

// ----- Rooms ---------------------------------------------------------------

export function roomSize(room: Room): string | null {
  if (!room.lengthFt || !room.widthFt) return null;
  return `${room.lengthFt} × ${room.widthFt} ft`;
}

export function roomLegend(room: Room): string {
  return [
    room.marker ? `${room.marker} ·` : null,
    room.name,
    roomSize(room) ? `— ${roomSize(room)}` : null,
  ]
    .filter(Boolean)
    .join(" ");
}

// Answers to the questions that aren't part of a room's core description
// (heat, fan, jack, and any "for each room" questions a landlord added).
const ROOM_CORE_KEYS = new Set([
  "id",
  "name",
  "type",
  "level",
  "marker",
  "lengthFt",
  "widthFt",
  "ceilingNote",
  "light",
  "tags",
  "notes",
  "countsAsBedroom",
]);

export function roomExtraFields(roomFields: Field[]): Field[] {
  return roomFields.filter((f) => !ROOM_CORE_KEYS.has(f.key));
}

export function roomExtraLines(room: Room, extraFields: Field[]): Line[] {
  const lines: Line[] = [];
  for (const field of extraFields) {
    const text = describe(field, (room as Record<string, unknown>)[field.key]);
    if (text) lines.push({ label: field.label, text });
  }
  return lines;
}

// ----- Spaces described elsewhere ---------------------------------------------

// The bathrooms and the basement are described in their own cards, but they
// belong on "The house, room by room" too. Derive them instead of asking the
// landlord to enter them twice.
export type DerivedSpace = {
  id: string;
  name: string;
  level: string; // "" when the bathroom has no floor set
  kind: "bathroom" | "basement";
  lines: Line[];
};

const BASEMENT_SUMMARY = [
  "type",
  "finish",
  "headClearance",
  "moisture",
  "access",
  "tenantUse",
  "mechanicals",
];

export function derivedSpaces(
  details: Details | null | undefined,
  rooms: Room[],
  questions: QuestionRecord[] = [],
): DerivedSpace[] {
  if (!details) return [];
  const spaces: DerivedSpace[] = [];

  const bathSection = withCustomFields(SECTION_BY_KEY.bathrooms, questions);
  ((details.bathrooms as SectionValue[] | undefined) ?? []).forEach((entry, i) => {
    const lines = entryLines(bathSection, entry).filter((l) => l.label !== "Floor");
    if (lines.length === 0 && !entry.level) return;
    spaces.push({
      id: `bath-${String(entry.id)}`,
      name: bathroomTitle(entry, i),
      level: typeof entry.level === "string" ? entry.level : "",
      kind: "bathroom",
      lines,
    });
  });

  const basement = details.basement as SectionValue | undefined;
  const alreadyListed = rooms.some(
    (r) => r.level === "Basement" || r.type === "basement",
  );
  if (basement && basement.type !== "none" && !alreadyListed) {
    const section = withCustomFields(SECTION_BY_KEY.basement, questions);
    const lines = entryLines(section, basement).filter((l) =>
      BASEMENT_SUMMARY.includes(
        section.fields.find((f) => f.label === l.label)?.key ?? "",
      ),
    );
    const laundry = details.laundry as SectionValue | undefined;
    if (laundry?.location === "basement")
      lines.push({ label: "Laundry", text: "Hookups here" });
    if (lines.length > 0) {
      spaces.push({
        id: "basement",
        name: "Basement",
        level: "Basement",
        kind: "basement",
        lines,
      });
    }
  }
  return spaces;
}

// ----- The public details: highlights and groups -----------------------------

const optionLabel = (section: Section, key: string, value: string) => {
  const field = section.fields.find((f) => f.key === key);
  return field ? labelOf(field, value) : value;
};

// "At a glance": the handful of facts a renter scans for first, plus the
// honest "worth knowing" quirks. Derived from the answers — nothing to enter
// twice — and never from a "Not sure".
export function highlights(
  details: Details | null | undefined,
  questions: QuestionRecord[] = [],
): { highlights: string[]; quirks: string[] } {
  if (!details) return { highlights: [], quirks: [] };
  const get = (section: SectionKey) =>
    (details[section] as SectionValue | undefined) ?? ({} as SectionValue);
  const sec = (key: SectionKey) => withCustomFields(SECTION_BY_KEY[key], questions);
  const tagLabels = (section: SectionKey, key: string, limit: number) => {
    const raw = get(section)[key];
    return (Array.isArray(raw) ? raw : [])
      .slice(0, limit)
      .map((v) => optionLabel(sec(section), key, String(v)));
  };

  const chips: string[] = [];
  chips.push(...tagLabels("character", "features", 3));

  const fireplace = get("character").fireplace;
  if (fireplace === "working") chips.push("Working fireplace");
  if (fireplace === "gas-log") chips.push("Gas-log fireplace");

  const baths = (details.bathrooms as SectionValue[] | undefined) ?? [];
  if (baths.some((b) => b.tub === "clawfoot")) chips.push("Claw-foot tub");

  if (get("kitchen").range === "gas") chips.push("Gas range");

  const heat = get("systems").heat;
  if (heat === "steam") chips.push("Steam heat");
  else if (heat === "hot-water") chips.push("Hot-water radiators");
  else if (heat === "forced-air") chips.push("Forced-air heat");

  const basement = get("basement");
  if (basement.type === "full" || basement.type === "partial") {
    chips.push(
      basement.finish === "finished"
        ? "Finished basement"
        : basement.type === "full"
          ? "Full basement"
          : "Partial basement",
    );
  }

  const energy = get("energy");
  if (energy.evCharging === "outlet-240" || energy.evCharging === "charger")
    chips.push("EV charging");
  if (energy.solar === "owned" || energy.solar === "leased") chips.push("Solar panels");

  const tech = get("tech");
  if (tech.lockType === "smart") chips.push("Smart lock");
  if (Array.isArray(tech.internet) && tech.internet.includes("fiber"))
    chips.push("Fiber internet");

  const outdoors = get("outdoors");
  if (outdoors.porch === "yes") chips.push("Porch");
  if (outdoors.yard === "fenced") chips.push("Fenced yard");

  const laundry = get("laundry");
  if (laundry.washerHookup === "yes" && laundry.location && laundry.location !== "none") {
    chips.push("Laundry hookups");
  }

  const quirks = tagLabels("character", "quirks", 4);
  if (get("character").partyWall === "yes")
    quirks.push("Shares a wall with the neighbor");

  return { highlights: [...new Set(chips)].slice(0, 10), quirks };
}

// Twelve small cards became four headings. "Good to know" opens by default,
// since disclosures shouldn't sit behind a tap; so does the first group.
export const PUBLIC_GROUPS: {
  key: string;
  title: string;
  sections: SectionKey[];
  open: boolean;
}[] = [
  {
    key: "inside",
    title: "Inside the house",
    sections: ["kitchen", "bathrooms", "basement", "laundry"],
    open: true,
  },
  {
    key: "systems",
    title: "Systems, energy and tech",
    sections: ["systems", "energy", "tech"],
    open: false,
  },
  {
    key: "living",
    title: "Living here",
    sections: ["character", "upkeep", "outdoors", "general"],
    open: false,
  },
  { key: "good", title: "Good to know", sections: ["knownConditions"], open: true },
];

export type PublicGroup = {
  key: string;
  title: string;
  open: boolean;
  sections: PublicSection[];
  count: number; // how many details it holds
};

export function groupSections(sections: PublicSection[]): PublicGroup[] {
  return PUBLIC_GROUPS.map((group) => {
    const inGroup = sections.filter((s) => group.sections.includes(s.key));
    return {
      key: group.key,
      title: group.title,
      open: group.open,
      sections: inGroup,
      count: inGroup.reduce(
        (n, s) => n + s.blocks.reduce((m, b) => m + b.lines.length, 0),
        0,
      ),
    };
  }).filter((g) => g.sections.length > 0);
}
