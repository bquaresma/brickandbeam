import { z } from "zod";

import {
  LEVELS,
  ROOM_TAGS,
  ROOM_TYPES,
  SECTION_BY_KEY,
  UNSURE,
  type Field,
  type Section,
  type SectionKey,
} from "./catalog";

// Validation is generated from the catalog, so a form can only ever submit
// answers the catalog offers.
const values = (options: { value: string }[]) =>
  options.map((o) => o.value) as [string, ...string[]];

function fieldSchema(field: Field): z.ZodType {
  switch (field.type) {
    case "select":
      return z.enum(values(field.options));
    case "tri":
      return z.enum(["yes", "no", UNSURE]);
    case "tags":
      return z
        .array(
          field.allowCustom
            ? z.string().trim().min(1).max(80)
            : z.enum(values(field.options)),
        )
        .max(40);
    case "text":
      return z
        .string()
        .trim()
        .max(field.max ?? 500);
    case "number":
      return z.number().int().min(field.min).max(field.max);
  }
}

function entrySchema(section: Section) {
  const shape: Record<string, z.ZodType> = {};
  for (const field of section.fields) shape[field.key] = fieldSchema(field).optional();
  if (section.repeatable) {
    shape.id = z.string().trim().min(1).max(40);
    shape.name = z.string().trim().max(80).optional();
  }
  return z.object(shape); // unknown keys are stripped
}

export type SectionValue = Record<string, unknown>;
export type Details = { version: 1 } & Partial<
  Record<SectionKey, SectionValue | SectionValue[]>
>;

// Blank answers mean "not answered", not "empty string".
function clean(value: unknown): unknown {
  if (Array.isArray(value)) {
    const items = value.map(clean).filter((v) => v !== undefined);
    return items.length ? items : undefined;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => [k, clean(v)] as const)
      .filter(([, v]) => v !== undefined);
    return entries.length ? Object.fromEntries(entries) : undefined;
  }
  if (value === null || value === "") return undefined;
  return value;
}

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

function describeIssue(section: Section, issue: z.core.$ZodIssue): string {
  const key = issue.path.find((p): p is string => typeof p === "string" && p !== "id");
  const field = section.fields.find((f) => f.key === key);
  return field ? `Check “${field.label}”.` : "Check your answers and try again.";
}

export function parseSection(
  key: SectionKey,
  input: unknown,
): ParseResult<SectionValue | SectionValue[]> {
  const section = SECTION_BY_KEY[key];
  if (!section) return { ok: false, error: "Unknown section." };

  const cleaned = clean(input);
  const schema = section.repeatable
    ? z.array(entrySchema(section)).max(12)
    : entrySchema(section);
  const result = schema.safeParse(cleaned ?? (section.repeatable ? [] : {}));
  if (!result.success)
    return { ok: false, error: describeIssue(section, result.error.issues[0]) };
  return {
    ok: true,
    value: (clean(result.data) ?? (section.repeatable ? [] : {})) as SectionValue,
  };
}

// ----- Rooms ---------------------------------------------------------------

export const roomSchema = z.object({
  id: z.string().trim().min(1).max(40),
  name: z.string().trim().min(1, "Every room needs a name.").max(80),
  type: z.enum(values(ROOM_TYPES)).optional(),
  level: z.string().trim().max(40).optional(),
  marker: z.string().trim().max(3).optional(),
  lengthFt: z.number().min(1).max(200).optional(),
  widthFt: z.number().min(1).max(200).optional(),
  ceilingNote: z.string().trim().max(120).optional(),
  light: z.string().trim().max(160).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
  notes: z.string().trim().max(500).optional(),
  // For bedrooms: does it count as one (closet and an exit window)?
  countsAsBedroom: z.enum(["yes", "no", UNSURE]).optional(),
});
export type Room = z.infer<typeof roomSchema>;

export function parseRooms(input: unknown): ParseResult<Room[]> {
  const result = z
    .array(roomSchema)
    .max(40)
    .safeParse(clean(input) ?? []);
  if (!result.success) return { ok: false, error: result.error.issues[0].message };
  return { ok: true, value: result.data };
}

export const ROOM_TAG_VALUES = ROOM_TAGS.map((t) => t.value);
export { LEVELS };
