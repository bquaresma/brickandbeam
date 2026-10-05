"use client";

import { useState } from "react";

import { kitAsText } from "@/lib/channels/kits";
import type { ChannelKit } from "@/lib/channels/types";

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Older browsers and insecure contexts: fall back to a hidden textarea.
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
}

// One card per posting site: every field with its own Copy button, in the
// order the site's form asks for them.
export function ChannelCards({ kits }: { kits: ChannelKit[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(id: string, text: string) {
    await copyText(text);
    setCopied(id);
    setTimeout(() => setCopied((current) => (current === id ? null : current)), 1600);
  }

  return (
    <div className="space-y-6">
      {kits.map((kit) => (
        <section
          key={kit.id}
          id={kit.id}
          aria-labelledby={`${kit.id}-title`}
          className="rounded-lg border border-stone-200 bg-white p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id={`${kit.id}-title`} className="text-lg font-semibold text-[#3D2E24]">
                {kit.name}
              </h2>
              <p className="mt-0.5 text-sm text-stone-500">{kit.tagline}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => copy(`${kit.id}:all`, kitAsText(kit))}
                className="rounded-md border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                {copied === `${kit.id}:all` ? "Copied" : "Copy everything"}
              </button>
              <a
                href={kit.openUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-[#B1502F] px-3 py-2 text-sm font-medium text-white hover:bg-[#8F3F25]"
              >
                {kit.openLabel} ↗
              </a>
            </div>
          </div>

          <dl className="mt-4 divide-y divide-stone-100">
            {kit.fields.map((field) => {
              const id = `${kit.id}:${field.label}`;
              const over =
                field.softLimit != null && field.value.length > field.softLimit;
              return (
                <div
                  key={field.label}
                  className="grid grid-cols-1 gap-1 py-2.5 sm:grid-cols-[170px_minmax(0,1fr)_auto] sm:gap-4"
                >
                  <dt className="text-sm font-medium text-stone-600">{field.label}</dt>
                  <dd className="min-w-0 text-sm text-stone-900">
                    {field.value ? (
                      field.multiline ? (
                        <pre className="max-h-64 overflow-auto rounded-md bg-stone-50 p-3 font-sans whitespace-pre-wrap">
                          {field.value}
                        </pre>
                      ) : (
                        <span className="break-words">{field.value}</span>
                      )
                    ) : (
                      <span className="text-stone-400 italic">Not set</span>
                    )}
                    {field.softLimit != null && field.value && (
                      <span
                        className={`ml-2 text-xs ${over ? "text-amber-700" : "text-stone-400"}`}
                      >
                        {field.value.length}/{field.softLimit}
                      </span>
                    )}
                    {field.hint && (
                      <p className="mt-0.5 text-xs text-stone-500">{field.hint}</p>
                    )}
                  </dd>
                  <dd>
                    {field.value && (
                      <button
                        type="button"
                        onClick={() => copy(id, field.value)}
                        aria-label={`Copy ${field.label} for ${kit.name}`}
                        className="rounded-md border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
                      >
                        {copied === id ? "Copied" : "Copy"}
                      </button>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>

          <p className="mt-3 text-sm text-stone-700">
            <span className="font-medium">Photos:</span> {kit.photoNote}
          </p>
          {kit.notes.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-stone-500">
              {kit.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
