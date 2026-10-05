import { z } from "zod";

import { SECTIONS, SECTION_KEYS, type Field, type Option, type Section } from "./catalog";

// Questions landlords add beyond the built-in catalog. A question works for
// its author at once; approved questions become available to everyone.
export const ROOMS_SCOPE = "rooms";
export const QUESTION_TYPES = ["TRI", "TEXT", "NUMBER", "SELECT"] as const;
export type QuestionTypeName = (typeof QUESTION_TYPES)[number];
export const QUESTION_STATUSES = [
  "PRIVATE",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
] as const;
export type QuestionStatusName = (typeof QUESTION_STATUSES)[number];

export const TYPE_LABELS: Record<QuestionTypeName, string> = {
  TRI: "Yes / No / Not sure",
  TEXT: "Short text",
  NUMBER: "A number",
  SELECT: "Choose one",
};

// Where a question can live: any card, or once per room.
export const PLACEMENTS: Option[] = [
  ...SECTIONS.map((s) => ({ value: s.key, label: s.title })),
  { value: ROOMS_SCOPE, label: "Asked for each room" },
];

export type QuestionRecord = {
  key: string;
  label: string;
  help?: string | null;
  type: QuestionTypeName;
  options?: unknown;
  unit?: string | null;
  section: string;
};

function asOptions(raw: unknown): Option[] {
  return Array.isArray(raw)
    ? raw.filter(
        (o): o is Option =>
          !!o && typeof o.value === "string" && typeof o.label === "string",
      )
    : [];
}

export function questionToField(q: QuestionRecord): Field {
  const base = { key: q.key, label: q.label, ...(q.help ? { help: q.help } : {}) };
  switch (q.type) {
    case "TRI":
      return { ...base, type: "tri" };
    case "NUMBER":
      return {
        ...base,
        type: "number",
        min: 0,
        max: 1_000_000,
        decimal: true,
        unit: q.unit ?? undefined,
      };
    case "SELECT":
      return { ...base, type: "select", options: asOptions(q.options) };
    default:
      return { ...base, type: "text", max: 300 };
  }
}

// A section with the given questions appended (before its trailing "notes"
// field). A question whose key already exists in the section is skipped, so a
// question that has graduated into the built-in catalog is never shown twice.
export function withCustomFields(section: Section, questions: QuestionRecord[]): Section {
  const have = new Set(section.fields.map((f) => f.key));
  const extra = questions
    .filter((q) => q.section === section.key && !have.has(q.key))
    .map(questionToField);
  if (extra.length === 0) return section;

  const notes = section.fields.findIndex((f) => f.key === "notes");
  const fields =
    notes === -1
      ? [...section.fields, ...extra]
      : [...section.fields.slice(0, notes), ...extra, ...section.fields.slice(notes)];
  return { ...section, fields };
}

export const roomQuestionFields = (questions: QuestionRecord[]): Field[] =>
  questions.filter((q) => q.section === ROOMS_SCOPE).map(questionToField);

// ----- Defining a question --------------------------------------------------

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

// One option label per line (or comma-separated) -> options with stable values.
export function parseOptionLines(text: string): Option[] {
  const seen = new Set<string>();
  const out: Option[] = [];
  for (const raw of text.split(/[\n,]/)) {
    const label = raw.trim().slice(0, 60);
    if (!label) continue;
    let value = slug(label) || "option";
    for (let n = 2; seen.has(value); n++) value = `${slug(label) || "option"}-${n}`;
    seen.add(value);
    out.push({ value, label });
  }
  return out;
}

const definitionSchema = z.object({
  label: z
    .string()
    .trim()
    .min(3, "Give the question a label of at least 3 characters.")
    .max(120),
  help: z.string().trim().max(200).optional(),
  type: z.enum(QUESTION_TYPES),
  optionsText: z.string().max(1200).optional(),
  unit: z.string().trim().max(12).optional(),
  section: z.enum([...SECTION_KEYS, ROOMS_SCOPE] as [string, ...string[]]),
  submitNote: z.string().trim().max(400).optional(),
});

export type QuestionDefinition = {
  label: string;
  help: string | null;
  type: QuestionTypeName;
  options: Option[] | null;
  unit: string | null;
  section: string;
};

export function parseQuestionDefinition(
  input: unknown,
): { ok: true; value: QuestionDefinition } | { ok: false; error: string } {
  const parsed = definitionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;

  let options: Option[] | null = null;
  if (d.type === "SELECT") {
    options = parseOptionLines(d.optionsText ?? "");
    if (options.length < 2)
      return { ok: false, error: "List at least two choices, one per line." };
    if (options.length > 12) return { ok: false, error: "Use 12 choices or fewer." };
  }
  return {
    ok: true,
    value: {
      label: d.label,
      help: d.help || null,
      type: d.type,
      options,
      unit: d.type === "NUMBER" ? d.unit || null : null,
      section: d.section,
    },
  };
}

// ----- Graduating a question into the built-in catalog ---------------------

// TypeScript for a catalog entry. Reusing the same key means every answer
// already stored keeps working when the question moves into catalog.ts.
export function catalogSnippet(q: QuestionRecord): string {
  const lines = [
    `      {`,
    `        key: ${JSON.stringify(q.key)},`,
    `        label: ${JSON.stringify(q.label)},`,
  ];
  const typeName =
    q.type === "TRI"
      ? "tri"
      : q.type === "NUMBER"
        ? "number"
        : q.type === "SELECT"
          ? "select"
          : "text";
  lines.push(`        type: ${JSON.stringify(typeName)},`);
  if (q.type === "SELECT") {
    const options = asOptions(q.options)
      .map((o) => `[${JSON.stringify(o.value)}, ${JSON.stringify(o.label)}]`)
      .join(", ");
    lines.push(`        options: opts(${options}),`);
  }
  if (q.type === "NUMBER") {
    lines.push(`        min: 0,`, `        max: 1000000,`, `        decimal: true,`);
    if (q.unit) lines.push(`        unit: ${JSON.stringify(q.unit)},`);
  }
  if (q.type === "TEXT") lines.push(`        max: 300,`);
  if (q.help) lines.push(`        help: ${JSON.stringify(q.help)},`);
  lines.push(`      },`);
  const where =
    q.section === ROOMS_SCOPE ? "ROOM_FIELDS" : `the "${q.section}" section's fields`;
  return `// Add to ${where} in src/lib/details/catalog.ts\n${lines.join("\n")}`;
}
