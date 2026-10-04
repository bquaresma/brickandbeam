import {
  SECTION_BY_KEY,
  UNSURE,
  type Field,
  type Section,
  type SectionKey,
} from "./catalog";
import type { Details, Room, SectionValue } from "./schema";

export type Line = { label: string; text: string; multiline?: boolean };

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
// to say is omitted entirely.
export function publicSections(details: Details | null | undefined): PublicSection[] {
  if (!details) return [];
  const out: PublicSection[] = [];
  for (const section of Object.values(SECTION_BY_KEY)) {
    const raw = details[section.key];
    if (!raw) continue;
    const entries = section.repeatable ? (raw as SectionValue[]) : [raw as SectionValue];
    const blocks = entries
      .map((entry, i) => ({
        title: section.repeatable ? bathroomTitle(entry, i) : undefined,
        lines: entryLines(section, entry),
      }))
      .filter((b) => b.lines.length > 0);
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
  const counted = section.fields.filter((f) => f.key !== "notes");
  return {
    answered: counted.filter((f) => describe(f, value[f.key]) !== null).length,
    total: counted.length,
    open: countOpen(section, value),
  };
}

function countOpen(section: Section, value: SectionValue) {
  return section.fields.filter((f) => value[f.key] === UNSURE).length;
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
