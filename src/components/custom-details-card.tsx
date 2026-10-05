"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { saveFacts } from "@/lib/actions/details";
import {
  createQuestion,
  deleteQuestion,
  suggestQuestion,
  updateQuestion,
  withdrawQuestion,
} from "@/lib/actions/questions";
import {
  PLACEMENTS,
  QUESTION_TYPES,
  ROOMS_SCOPE,
  TYPE_LABELS,
  type QuestionTypeName,
} from "@/lib/details/custom";
import type { Fact } from "@/lib/details/schema";
import type { QuestionView } from "@/lib/questions";

const control =
  "mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-[#B1502F] focus:outline-none";
const button =
  "rounded-md border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50";
const primary =
  "rounded-md bg-[#B1502F] px-4 py-2 text-sm font-medium text-white hover:bg-[#8F3F25] disabled:opacity-50";

const placementLabel = (value: string) =>
  PLACEMENTS.find((p) => p.value === value)?.label ?? value;

const STATUS_TEXT = (q: QuestionView) =>
  q.status === "PRIVATE"
    ? "Only you can see this question."
    : q.status === "SUBMITTED"
      ? "Suggested for everyone — waiting for review."
      : q.status === "APPROVED"
        ? "Approved — every landlord can use it."
        : `Not added for everyone${q.reviewNote ? `: ${q.reviewNote}` : "."} It still works for you.`;

// Free-form facts, plus the landlord's own questions and their review status.
export function CustomDetailsCard({
  propertyId,
  unitId,
  initialFacts,
  questions,
}: {
  propertyId: string;
  unitId: string;
  initialFacts: Fact[];
  questions: QuestionView[];
}) {
  const router = useRouter();
  const [facts, setFacts] = useState(initialFacts);
  const [factStatus, setFactStatus] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState<string | null>(null);

  const mine = questions.filter((q) => q.mine);
  const shared = questions.filter((q) => !q.mine);

  const [draft, setDraft] = useState({
    label: "",
    help: "",
    type: "TRI" as QuestionTypeName,
    optionsText: "",
    unit: "",
    section: "general",
  });

  async function run(
    action: () => Promise<{ error: string } | undefined>,
    after?: () => void,
  ) {
    setBusy(true);
    setMessage(null);
    const result = await action();
    setBusy(false);
    if (result?.error) setMessage(result.error);
    else {
      after?.();
      router.refresh();
    }
  }

  async function saveFactRows() {
    setFactStatus("Saving…");
    const result = await saveFacts(propertyId, unitId, facts);
    setFactStatus(result?.error ?? "Saved");
  }

  return (
    <section
      id="custom"
      className="scroll-mt-6 rounded-lg border border-stone-200 bg-white p-5"
      aria-labelledby="custom-title"
    >
      <h2 id="custom-title" className="text-lg font-semibold text-[#3D2E24]">
        Your own details and questions
      </h2>
      <p className="mt-1 text-sm text-stone-500">
        Something about this house we didn&apos;t ask? Add a quick fact below, or add a
        question of your own (a smart lock model, pest history, a feature only this house
        has).
      </p>

      <h3 className="mt-5 text-sm font-semibold text-stone-700">Quick facts</h3>
      <p className="text-xs text-stone-500">
        A label and a value, shown under &ldquo;More about the house&rdquo;. For example:
        Internet — fiber available.
      </p>
      <div className="mt-2 space-y-2">
        {facts.map((fact, index) => (
          <div key={fact.id} className="flex flex-wrap items-end gap-2">
            <div className="min-w-40 flex-1">
              <label
                htmlFor={`fact-label-${fact.id}`}
                className="block text-xs font-medium text-stone-600"
              >
                Label
              </label>
              <input
                id={`fact-label-${fact.id}`}
                type="text"
                maxLength={80}
                value={fact.label}
                onChange={(e) => {
                  setFacts((all) =>
                    all.map((f, i) =>
                      i === index ? { ...f, label: e.target.value } : f,
                    ),
                  );
                  setFactStatus(null);
                }}
                className={control}
              />
            </div>
            <div className="min-w-48 flex-[2]">
              <label
                htmlFor={`fact-value-${fact.id}`}
                className="block text-xs font-medium text-stone-600"
              >
                Value
              </label>
              <input
                id={`fact-value-${fact.id}`}
                type="text"
                maxLength={200}
                value={fact.value}
                onChange={(e) => {
                  setFacts((all) =>
                    all.map((f, i) =>
                      i === index ? { ...f, value: e.target.value } : f,
                    ),
                  );
                  setFactStatus(null);
                }}
                className={control}
              />
            </div>
            <button
              type="button"
              className="rounded border border-red-200 px-3 py-2 text-xs text-red-700 hover:bg-red-50"
              onClick={() => {
                setFacts((all) => all.filter((_, i) => i !== index));
                setFactStatus(null);
              }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={button}
          onClick={() => {
            setFacts((all) => [
              ...all,
              {
                id: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
                label: "",
                value: "",
              },
            ]);
            setFactStatus(null);
          }}
        >
          + Add a fact
        </button>
        <button type="button" className={primary} onClick={saveFactRows}>
          Save facts
        </button>
        <p role="status" className="text-sm">
          {factStatus === "Saved" ? (
            <span className="text-green-700">Saved</span>
          ) : (
            factStatus
          )}
        </p>
      </div>

      <h3 className="mt-8 text-sm font-semibold text-stone-700">Your questions</h3>
      <p className="text-xs text-stone-500">
        A question you add appears in the card you choose (or for every room) and works
        for you immediately. If it would help other landlords, suggest it for everyone and
        it will be reviewed.
      </p>

      {mine.length > 0 && (
        <ul className="mt-3 space-y-3">
          {mine.map((q) => (
            <li key={q.id} className="rounded-md border border-stone-200 bg-stone-50 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium text-stone-800">{q.label}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    q.status === "APPROVED"
                      ? "bg-green-100 text-green-800"
                      : q.status === "SUBMITTED"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-stone-200 text-stone-700"
                  }`}
                >
                  {q.status === "PRIVATE"
                    ? "Private"
                    : q.status === "SUBMITTED"
                      ? "In review"
                      : q.status === "APPROVED"
                        ? "Approved"
                        : "Not shared"}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-stone-500">
                {TYPE_LABELS[q.type]} · in {placementLabel(q.section)}
              </p>
              <p className="mt-1 text-sm text-stone-600">{STATUS_TEXT(q)}</p>

              {editing === q.id ? (
                <QuestionEditor
                  question={q}
                  busy={busy}
                  onCancel={() => setEditing(null)}
                  onSave={(input) =>
                    run(
                      () => updateQuestion(q.id, input),
                      () => setEditing(null),
                    )
                  }
                />
              ) : suggesting === q.id ? (
                <SuggestForm
                  busy={busy}
                  onCancel={() => setSuggesting(null)}
                  onSend={(note) =>
                    run(
                      () => suggestQuestion(q.id, note),
                      () => setSuggesting(null),
                    )
                  }
                />
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {(q.status === "PRIVATE" || q.status === "REJECTED") && (
                    <>
                      <button
                        type="button"
                        className={button}
                        onClick={() => setEditing(q.id)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={button}
                        onClick={() => setSuggesting(q.id)}
                      >
                        Suggest for everyone
                      </button>
                    </>
                  )}
                  {q.status === "SUBMITTED" && (
                    <button
                      type="button"
                      className={button}
                      disabled={busy}
                      onClick={() => run(() => withdrawQuestion(q.id))}
                    >
                      Withdraw suggestion
                    </button>
                  )}
                  {q.status !== "APPROVED" && q.status !== "SUBMITTED" && (
                    <button
                      type="button"
                      className="rounded-md border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                      disabled={busy}
                      onClick={() => {
                        if (confirm("Delete this question?"))
                          void run(() => deleteQuestion(q.id));
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <form
        className="mt-4 rounded-md border border-dashed border-stone-300 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          void run(
            () => createQuestion(draft),
            () =>
              setDraft({
                label: "",
                help: "",
                type: "TRI",
                optionsText: "",
                unit: "",
                section: draft.section,
              }),
          );
        }}
      >
        <h4 className="text-sm font-semibold text-stone-700">Add a question</h4>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="q-label" className="block text-sm font-medium text-stone-700">
              The question
            </label>
            <input
              id="q-label"
              type="text"
              required
              maxLength={120}
              placeholder="e.g. Bike storage"
              value={draft.label}
              onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              className={control}
            />
          </div>
          <div>
            <label htmlFor="q-type" className="block text-sm font-medium text-stone-700">
              Answer type
            </label>
            <select
              id="q-type"
              value={draft.type}
              onChange={(e) =>
                setDraft({ ...draft, type: e.target.value as QuestionTypeName })
              }
              className={control}
            >
              {QUESTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="q-section"
              className="block text-sm font-medium text-stone-700"
            >
              Where it appears
            </label>
            <select
              id="q-section"
              value={draft.section}
              onChange={(e) => setDraft({ ...draft, section: e.target.value })}
              className={control}
            >
              {PLACEMENTS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            {draft.section === ROOMS_SCOPE && (
              <p className="mt-0.5 text-xs text-stone-500">
                Asked once for every room you list.
              </p>
            )}
          </div>
          {draft.type === "SELECT" && (
            <div className="sm:col-span-2">
              <label
                htmlFor="q-options"
                className="block text-sm font-medium text-stone-700"
              >
                Choices (one per line, at least two)
              </label>
              <textarea
                id="q-options"
                rows={3}
                value={draft.optionsText}
                onChange={(e) => setDraft({ ...draft, optionsText: e.target.value })}
                className={control}
              />
            </div>
          )}
          {draft.type === "NUMBER" && (
            <div>
              <label
                htmlFor="q-unit"
                className="block text-sm font-medium text-stone-700"
              >
                Unit (optional)
              </label>
              <input
                id="q-unit"
                type="text"
                maxLength={12}
                placeholder="ft, kW, years…"
                value={draft.unit}
                onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                className={control}
              />
            </div>
          )}
          <div className="sm:col-span-2">
            <label htmlFor="q-help" className="block text-sm font-medium text-stone-700">
              Hint shown under the question (optional)
            </label>
            <input
              id="q-help"
              type="text"
              maxLength={200}
              value={draft.help}
              onChange={(e) => setDraft({ ...draft, help: e.target.value })}
              className={control}
            />
          </div>
        </div>
        <button type="submit" disabled={busy} className={`${primary} mt-3`}>
          {busy ? "Adding…" : "Add question"}
        </button>
      </form>

      {message && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {message}
        </p>
      )}

      {shared.length > 0 && (
        <>
          <h3 className="mt-8 text-sm font-semibold text-stone-700">
            Approved questions from other landlords
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone-600">
            {shared.map((q) => (
              <li key={q.id}>
                {q.label}{" "}
                <span className="text-stone-400">— in {placementLabel(q.section)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function QuestionEditor({
  question,
  busy,
  onSave,
  onCancel,
}: {
  question: QuestionView;
  busy: boolean;
  onSave: (input: {
    label: string;
    help: string;
    type: string;
    optionsText: string;
    unit: string;
    section: string;
  }) => void;
  onCancel: () => void;
}) {
  const options = Array.isArray(question.options)
    ? (question.options as { label: string }[])
    : [];
  const [label, setLabel] = useState(question.label);
  const [help, setHelp] = useState(question.help ?? "");
  const [optionsText, setOptionsText] = useState(options.map((o) => o.label).join("\n"));
  const [unit, setUnit] = useState(question.unit ?? "");
  return (
    <div className="mt-3 space-y-2">
      <label className="block text-sm font-medium text-stone-700">
        The question
        <input
          type="text"
          value={label}
          maxLength={120}
          onChange={(e) => setLabel(e.target.value)}
          className={control}
        />
      </label>
      <label className="block text-sm font-medium text-stone-700">
        Hint (optional)
        <input
          type="text"
          value={help}
          maxLength={200}
          onChange={(e) => setHelp(e.target.value)}
          className={control}
        />
      </label>
      {question.type === "SELECT" && (
        <label className="block text-sm font-medium text-stone-700">
          Choices (one per line)
          <textarea
            rows={3}
            value={optionsText}
            onChange={(e) => setOptionsText(e.target.value)}
            className={control}
          />
        </label>
      )}
      {question.type === "NUMBER" && (
        <label className="block text-sm font-medium text-stone-700">
          Unit
          <input
            type="text"
            value={unit}
            maxLength={12}
            onChange={(e) => setUnit(e.target.value)}
            className={control}
          />
        </label>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          className={primary}
          onClick={() =>
            onSave({
              label,
              help,
              type: question.type,
              optionsText,
              unit,
              section: question.section,
            })
          }
        >
          Save question
        </button>
        <button type="button" className={button} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function SuggestForm({
  busy,
  onSend,
  onCancel,
}: {
  busy: boolean;
  onSend: (note: string) => void;
  onCancel: () => void;
}) {
  const [note, setNote] = useState("");
  return (
    <div className="mt-3 space-y-2">
      <label className="block text-sm font-medium text-stone-700">
        Why would other landlords want this? (optional)
        <textarea
          rows={2}
          maxLength={400}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={control}
        />
      </label>
      <p className="text-xs text-stone-500">
        Your question&apos;s wording will be reviewed. Your answers about your own house
        are never shared.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          className={primary}
          onClick={() => onSend(note)}
        >
          Send for review
        </button>
        <button type="button" className={button} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
