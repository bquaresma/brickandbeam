"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { FieldInput } from "@/components/field-input";
import { useReportProgress } from "@/components/walkthrough-shell";
import { saveDetailsSection } from "@/lib/actions/details";
import { UNSURE, type Field, type Section } from "@/lib/details/catalog";
import { isVisible, progress, pruneHidden } from "@/lib/details/format";
import type { SectionValue } from "@/lib/details/schema";

type Entry = SectionValue;
type Status =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "error"; message: string };

// One card of the walk-through. Works for ordinary sections (one set of
// answers) and repeatable ones (an entry per bathroom).
export function DetailsCard({
  propertyId,
  unitId,
  section,
  initial,
}: {
  propertyId: string;
  unitId: string;
  section: Section;
  initial: Entry | Entry[] | undefined;
}) {
  const [single, setSingle] = useState<Entry>(
    section.repeatable ? {} : ((initial as Entry) ?? {}),
  );
  const [entries, setEntries] = useState<Entry[]>(
    section.repeatable ? ((initial as Entry[]) ?? []) : [],
  );
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const value = section.repeatable ? entries : single;
  const stats = progress(section, value);

  // Tell the sidebar how far along this card is.
  const report = useReportProgress();
  useEffect(() => {
    report(section.key, {
      answered: stats.answered,
      total: stats.total,
      open: stats.open,
    });
  }, [report, section.key, stats.answered, stats.total, stats.open]);

  // Autosave: save shortly after typing stops. Saves are chained, so an older
  // save can never land after a newer one, and the latest answers always win.
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);
  const lastSaved = useRef(JSON.stringify(value));
  const chain = useRef<Promise<void>>(Promise.resolve());
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pending = useRef(false);

  const flush = useCallback(() => {
    if (!pending.current) return;
    pending.current = false;
    const snapshot = JSON.stringify(latest.current);
    lastSaved.current = snapshot;
    chain.current = chain.current.then(async () => {
      const result = await saveDetailsSection(
        propertyId,
        unitId,
        section.key,
        latest.current,
      );
      setStatus(
        result?.error
          ? { kind: "error", message: result.error }
          : pending.current
            ? { kind: "saving" }
            : { kind: "saved" },
      );
    });
  }, [propertyId, unitId, section.key]);

  useEffect(() => {
    if (JSON.stringify(value) === lastSaved.current) return;
    pending.current = true;
    setStatus({ kind: "saving" });
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, 900);
    return () => clearTimeout(timer.current);
  }, [value, flush]);

  // Leaving the page with a save still waiting: send it now.
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      flush();
    },
    [flush],
  );

  function fields(entry: Entry, set: (next: Entry) => void, prefix: string) {
    const visible = section.fields.filter((f) => isVisible(f, entry));
    return visible.flatMap((field: Field, i) => {
      const startsGroup =
        field.group && (i === 0 || visible[i - 1].group !== field.group);
      const wide = (field.type === "text" && field.multiline) || field.type === "tags";
      const node = (
        <div key={field.key} className={wide ? "col-span-full" : undefined}>
          {entry[field.key] === UNSURE && (
            <span className="mb-0.5 block text-xs font-medium text-amber-700">
              Open item
            </span>
          )}
          <FieldInput
            id={`${prefix}-${field.key}`}
            field={field}
            value={entry[field.key]}
            onChange={(next) => {
              set(pruneHidden(section.fields, { ...entry, [field.key]: next }));
            }}
          />
        </div>
      );
      return startsGroup
        ? [
            <h4
              key={`${field.key}-group`}
              className="col-span-full mt-2 border-t border-stone-100 pt-3 text-xs font-semibold tracking-wide text-stone-500 uppercase"
            >
              {field.group}
            </h4>,
            node,
          ]
        : [node];
    });
  }

  return (
    <section
      id={section.key}
      className="scroll-mt-6 rounded-lg border border-stone-200 bg-white p-5"
      aria-labelledby={`${section.key}-title`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={`${section.key}-title`} className="text-lg font-semibold text-[#3D2E24]">
          {section.title}
        </h2>
        <p className="text-xs text-stone-500">
          {stats.answered} of {stats.total} answered
          {stats.open > 0 && <span className="text-amber-700"> · {stats.open} open</span>}
        </p>
      </div>
      <p className="mt-1 text-sm text-stone-500">{section.intro}</p>

      {section.repeatable ? (
        <div className="mt-4 space-y-4">
          {entries.map((entry, index) => (
            <div
              key={String(entry.id)}
              className="rounded-md border border-stone-200 bg-stone-50 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <label
                    htmlFor={`${section.key}-${entry.id}-name`}
                    className="block text-sm font-medium text-stone-700"
                  >
                    Name this one (optional)
                  </label>
                  <input
                    id={`${section.key}-${entry.id}-name`}
                    type="text"
                    maxLength={80}
                    placeholder={`Bathroom ${index + 1}`}
                    value={typeof entry.name === "string" ? entry.name : ""}
                    onChange={(e) => {
                      setEntries((all) =>
                        all.map((x, i) =>
                          i === index ? { ...x, name: e.target.value } : x,
                        ),
                      );
                    }}
                    className="mt-1 block w-full max-w-sm rounded-md border border-stone-300 px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="button"
                  className="shrink-0 self-end rounded border border-red-200 px-3 py-2 text-xs text-red-700 hover:bg-red-50"
                  onClick={() => {
                    setEntries((all) => all.filter((_, i) => i !== index));
                  }}
                >
                  Remove
                </button>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {fields(
                  entry,
                  (next) =>
                    setEntries((all) => all.map((x, i) => (i === index ? next : x))),
                  `${section.key}-${entry.id}`,
                )}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              setEntries((all) => [
                ...all,
                { id: crypto.randomUUID().replace(/-/g, "").slice(0, 12) },
              ]);
            }}
            className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            + Add a bathroom
          </button>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields(single, setSingle, section.key)}
        </div>
      )}

      <p role="status" aria-live="polite" className="mt-5 min-h-5 text-sm">
        {status.kind === "saving" && <span className="text-stone-500">Saving…</span>}
        {status.kind === "saved" && <span className="text-green-700">Saved</span>}
        {status.kind === "error" && (
          <span className="text-red-600">{status.message}</span>
        )}
      </p>
    </section>
  );
}
