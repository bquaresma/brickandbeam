"use client";

import { useState } from "react";

import { UNSURE, type Field } from "@/lib/details/catalog";

const control =
  "mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-[#B1502F] focus:outline-none";

// Renders one catalog field. Used by the walk-through cards and the rooms editor.
export function FieldInput({
  field,
  value,
  onChange,
  id,
}: {
  field: Field;
  value: unknown;
  onChange: (next: unknown) => void;
  id: string;
}) {
  const label = (
    <span id={`${id}-label`} className="block text-sm font-medium text-stone-700">
      {field.label}
    </span>
  );
  const help = field.help ? (
    <p className="mt-0.5 text-xs text-stone-500">{field.help}</p>
  ) : null;

  switch (field.type) {
    case "select":
      return (
        <div>
          <label htmlFor={id} className="block text-sm font-medium text-stone-700">
            {field.label}
          </label>
          <select
            id={id}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value || undefined)}
            className={control}
          >
            <option value="">—</option>
            {field.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {help}
        </div>
      );

    case "tri": {
      const choices = [
        ["yes", "Yes"],
        ["no", "No"],
        [UNSURE, "Not sure"],
      ] as const;
      return (
        <div role="radiogroup" aria-labelledby={`${id}-label`}>
          {label}
          <div className="mt-1 inline-flex overflow-hidden rounded-md border border-stone-300">
            {choices.map(([v, text]) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={value === v}
                // Clicking the chosen answer again clears it.
                onClick={() => onChange(value === v ? undefined : v)}
                className={`px-3 py-1.5 text-sm ${
                  value === v
                    ? v === UNSURE
                      ? "bg-amber-100 font-medium text-amber-900"
                      : "bg-[#B1502F] font-medium text-white"
                    : "bg-white text-stone-600 hover:bg-stone-50"
                } ${v !== "yes" ? "border-l border-stone-300" : ""}`}
              >
                {text}
              </button>
            ))}
          </div>
          {help}
        </div>
      );
    }

    case "tags":
      return (
        <TagsInput
          field={field}
          value={value}
          onChange={onChange}
          id={id}
          label={label}
          help={help}
        />
      );

    case "text":
      return (
        <div>
          <label htmlFor={id} className="block text-sm font-medium text-stone-700">
            {field.label}
          </label>
          {field.multiline ? (
            <textarea
              id={id}
              rows={3}
              maxLength={field.max}
              placeholder={field.placeholder}
              value={typeof value === "string" ? value : ""}
              onChange={(e) => onChange(e.target.value)}
              className={control}
            />
          ) : (
            <input
              id={id}
              type="text"
              maxLength={field.max}
              placeholder={field.placeholder}
              value={typeof value === "string" ? value : ""}
              onChange={(e) => onChange(e.target.value)}
              className={control}
            />
          )}
          {help}
        </div>
      );

    case "number":
      return (
        <div>
          <label htmlFor={id} className="block text-sm font-medium text-stone-700">
            {field.label}
            {field.unit && field.unit !== "year" ? ` (${field.unit})` : ""}
          </label>
          <input
            id={id}
            type="number"
            inputMode="decimal"
            step={field.decimal ? "any" : 1}
            min={field.min}
            max={field.max}
            value={typeof value === "number" ? value : ""}
            onChange={(e) =>
              onChange(e.target.value === "" ? undefined : Number(e.target.value))
            }
            className={`${control} w-32`}
          />
          {help}
        </div>
      );
  }
}

function TagsInput({
  field,
  value,
  onChange,
  id,
  label,
  help,
}: {
  field: Extract<Field, { type: "tags" }>;
  value: unknown;
  onChange: (next: unknown) => void;
  id: string;
  label: React.ReactNode;
  help: React.ReactNode;
}) {
  const selected = Array.isArray(value) ? (value as string[]) : [];
  const [custom, setCustom] = useState("");
  const known = new Set(field.options.map((o) => o.value));
  const customSelected = selected.filter((v) => !known.has(v));
  const set = (next: string[]) => onChange(next.length ? next : undefined);

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-sm ${
      active
        ? "border-[#B1502F] bg-[#B1502F] text-white"
        : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
    }`;

  return (
    <div role="group" aria-labelledby={`${id}-label`}>
      {label}
      <div className="mt-1 flex flex-wrap gap-2">
        {field.options.map((o) => {
          const active = selected.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={active}
              onClick={() =>
                set(
                  active ? selected.filter((v) => v !== o.value) : [...selected, o.value],
                )
              }
              className={chip(active)}
            >
              {o.label}
            </button>
          );
        })}
        {customSelected.map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed
            aria-label={`Remove ${v}`}
            onClick={() => set(selected.filter((x) => x !== v))}
            className={chip(true)}
          >
            {v} ✕
          </button>
        ))}
      </div>
      {field.allowCustom && (
        <div className="mt-2 flex gap-2">
          <input
            id={id}
            type="text"
            value={custom}
            maxLength={80}
            placeholder="Add your own…"
            aria-label={`Add your own: ${field.label}`}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            className="block w-full max-w-xs rounded-md border border-stone-300 px-3 py-1.5 text-sm focus:border-[#B1502F] focus:outline-none"
          />
          <button
            type="button"
            onClick={add}
            className="rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
          >
            Add
          </button>
        </div>
      )}
      {help}
    </div>
  );

  function add() {
    const text = custom.trim();
    if (text && !selected.includes(text)) set([...selected, text]);
    setCustom("");
  }
}
