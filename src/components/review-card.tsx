"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { approveQuestion, rejectQuestion } from "@/lib/actions/admin";
import { PLACEMENTS, TYPE_LABELS, type QuestionTypeName } from "@/lib/details/custom";

const control =
  "mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-[#B1502F] focus:outline-none";

export type ReviewItem = {
  id: string;
  label: string;
  help: string | null;
  type: QuestionTypeName;
  options: { label: string }[];
  unit: string | null;
  section: string;
  author: string;
  submitNote: string | null;
  usage: number;
  snippet: string;
};

// One suggested question awaiting a decision.
export function ReviewCard({ item }: { item: ReviewItem }) {
  const router = useRouter();
  const [label, setLabel] = useState(item.label);
  const [help, setHelp] = useState(item.help ?? "");
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<{ error: string } | undefined>) {
    setBusy(true);
    setMessage(null);
    const result = await action();
    setBusy(false);
    if (result?.error) setMessage(result.error);
    else router.refresh();
  }

  const placement =
    PLACEMENTS.find((p) => p.value === item.section)?.label ?? item.section;

  return (
    <li className="rounded-lg border border-stone-200 bg-white p-5">
      <p className="text-xs text-stone-500">
        Suggested by {item.author} · {TYPE_LABELS[item.type]} · in {placement} · used in{" "}
        {item.usage} {item.usage === 1 ? "house" : "houses"}
      </p>
      {item.options.length > 0 && (
        <p className="mt-1 text-sm text-stone-600">
          Choices: {item.options.map((o) => o.label).join(", ")}
        </p>
      )}
      {item.submitNote && (
        <p className="mt-2 rounded bg-stone-50 p-2 text-sm text-stone-700">
          “{item.submitNote}”
        </p>
      )}

      <label className="mt-3 block text-sm font-medium text-stone-700">
        Wording shown to every landlord
        <input
          type="text"
          value={label}
          maxLength={120}
          onChange={(e) => setLabel(e.target.value)}
          className={control}
        />
      </label>
      <label className="mt-2 block text-sm font-medium text-stone-700">
        Hint (optional)
        <input
          type="text"
          value={help}
          maxLength={200}
          onChange={(e) => setHelp(e.target.value)}
          className={control}
        />
      </label>

      {rejecting ? (
        <div className="mt-3 space-y-2">
          <label className="block text-sm font-medium text-stone-700">
            Reason (shown to the author)
            <input
              type="text"
              value={note}
              maxLength={400}
              placeholder="Already covered by Systems → Electrical"
              onChange={(e) => setNote(e.target.value)}
              className={control}
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => rejectQuestion(item.id, note))}
              className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={() => setRejecting(false)}
              className="rounded-md border border-stone-300 px-3 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => approveQuestion(item.id, { label, help }))}
            className="rounded-md bg-[#B1502F] px-4 py-2 text-sm font-medium text-white hover:bg-[#8F3F25] disabled:opacity-50"
          >
            Approve for everyone
          </button>
          <button
            type="button"
            onClick={() => setRejecting(true)}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Reject…
          </button>
        </div>
      )}
      {message && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {message}
        </p>
      )}
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-stone-500">
          Make it a built-in question (code)
        </summary>
        <pre className="mt-2 overflow-auto rounded bg-stone-900 p-3 text-xs text-stone-100">
          {item.snippet}
        </pre>
      </details>
    </li>
  );
}
