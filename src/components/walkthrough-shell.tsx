"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { Progress } from "@/lib/details/format";

export type Step = {
  key: string;
  title: string;
  node: React.ReactNode;
  // Starting progress (computed on the server) so the sidebar isn't blank
  // before the cards mount.
  progress?: Progress;
};

type Reporter = (key: string, progress: Progress) => void;
const ProgressContext = createContext<Reporter>(() => {});

// Cards call this to tell the sidebar how far along they are.
export function useReportProgress() {
  return useContext(ProgressContext);
}

const REVIEW = "review";

// The house walk-through: a sidebar of sections on a computer, a guided
// step-by-step flow on a phone. Every panel stays mounted (just hidden), so
// answers typed in one step are never lost by moving to another.
export function WalkthroughShell({
  steps,
  propertyHref,
  previewHref,
}: {
  steps: Step[];
  propertyHref: string;
  previewHref: string | null;
}) {
  const keys = useMemo(() => [...steps.map((s) => s.key), REVIEW], [steps]);
  const [active, setActive] = useState(keys[0]);
  const [progress, setProgress] = useState<Record<string, Progress>>(() =>
    Object.fromEntries(steps.filter((s) => s.progress).map((s) => [s.key, s.progress!])),
  );
  const panelsRef = useRef<HTMLDivElement>(null);

  const report = useCallback<Reporter>((key, p) => {
    setProgress((all) => {
      const old = all[key];
      return old &&
        old.answered === p.answered &&
        old.total === p.total &&
        old.open === p.open
        ? all
        : { ...all, [key]: p };
    });
  }, []);

  const go = useCallback(
    (key: string) => {
      if (!keys.includes(key)) return;
      setActive(key);
      history.replaceState(null, "", `#${key}`);
      // Land at the top of the new step, ready to read.
      requestAnimationFrame(() => {
        const panel = panelsRef.current;
        if (!panel) return;
        window.scrollTo({
          top: Math.max(0, panel.getBoundingClientRect().top + window.scrollY - 16),
        });
        panel.focus({ preventScroll: true });
      });
    },
    [keys],
  );

  // Deep links: /walkthrough#basement opens the basement.
  useEffect(() => {
    const fromHash = () => {
      const key = window.location.hash.slice(1);
      if (key && keys.includes(key)) setActive(key);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [keys]);

  const index = keys.indexOf(active);
  const totals = steps.reduce(
    (sum, s) => {
      const p = progress[s.key];
      return p
        ? {
            answered: sum.answered + p.answered,
            total: sum.total + p.total,
            open: sum.open + p.open,
          }
        : sum;
    },
    { answered: 0, total: 0, open: 0 },
  );
  const percent = totals.total ? Math.round((totals.answered / totals.total) * 100) : 0;
  const titleOf = (key: string) =>
    key === REVIEW ? "Review" : (steps.find((s) => s.key === key)?.title ?? key);

  const badge = (key: string) => {
    const p = progress[key];
    if (!p || p.total === 0) return null;
    return (
      <span className="flex items-center gap-1.5 text-xs">
        {p.open > 0 && (
          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 font-medium text-amber-800">
            {p.open} open
          </span>
        )}
        <span className="text-stone-500">
          {p.answered >= p.total ? "✓" : `${p.answered}/${p.total}`}
        </span>
      </span>
    );
  };

  return (
    <ProgressContext.Provider value={report}>
      <div className="mt-4 rounded-lg border border-stone-200 bg-white p-4">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium text-stone-700">
            {totals.answered} of {totals.total} questions answered
          </span>
          <span className="text-stone-500">
            {percent}%
            {totals.open > 0 && (
              <span className="text-amber-700"> · {totals.open} open</span>
            )}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded bg-stone-100">
          <div className="h-full bg-[#B1502F]" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[230px_minmax(0,1fr)]">
        {/* Computer: every section, always in view. */}
        <nav
          aria-label="Sections"
          className="hidden self-start md:sticky md:top-4 md:block"
        >
          <ul className="space-y-1">
            {[...steps.map((s) => s.key), REVIEW].map((key) => (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => go(key)}
                  aria-current={key === active ? "step" : undefined}
                  className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm ${
                    key === active
                      ? "bg-[#B1502F] font-medium text-white"
                      : "text-stone-700 hover:bg-white"
                  }`}
                >
                  <span className="leading-tight">{titleOf(key)}</span>
                  <span
                    className={
                      key === active
                        ? "text-white/90 [&_*]:!bg-transparent [&_*]:!text-white"
                        : ""
                    }
                  >
                    {badge(key)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          {/* Phone: where you are, and a way to jump. */}
          <div className="md:hidden">
            <p className="text-sm font-medium text-stone-700" aria-live="polite">
              Step {index + 1} of {keys.length} — {titleOf(active)}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded bg-stone-200">
              <div
                className="h-full bg-[#B1502F] transition-all"
                style={{ width: `${((index + 1) / keys.length) * 100}%` }}
              />
            </div>
            <label className="mt-3 block text-xs font-medium text-stone-500">
              Jump to
              <select
                value={active}
                onChange={(e) => go(e.target.value)}
                className="mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800"
              >
                {keys.map((key) => (
                  <option key={key} value={key}>
                    {titleOf(key)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div ref={panelsRef} tabIndex={-1} className="mt-4 outline-none md:mt-0">
            {steps.map((step) => (
              <div key={step.key} hidden={active !== step.key}>
                {step.node}
              </div>
            ))}

            <div hidden={active !== REVIEW}>
              <section
                id={REVIEW}
                aria-labelledby="review-title"
                className="rounded-lg border border-stone-200 bg-white p-5"
              >
                <h2 id="review-title" className="text-lg font-semibold text-[#3D2E24]">
                  Review
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  Everything is saved as you go. Here is what still needs a look.
                </p>
                <ul className="mt-4 divide-y divide-stone-100 text-sm">
                  {steps
                    .filter((s) => progress[s.key] && progress[s.key].total > 0)
                    .map((s) => {
                      const p = progress[s.key];
                      const status =
                        p.answered === 0
                          ? "Not started"
                          : p.answered >= p.total
                            ? "Complete"
                            : `${p.answered} of ${p.total} answered`;
                      return (
                        <li
                          key={s.key}
                          className="flex flex-wrap items-center justify-between gap-2 py-2"
                        >
                          <button
                            type="button"
                            onClick={() => go(s.key)}
                            className="text-left font-medium text-[#B1502F] underline"
                          >
                            {s.title}
                          </button>
                          <span className="text-stone-500">
                            {status}
                            {p.open > 0 && (
                              <span className="text-amber-700">
                                {" "}
                                · {p.open} marked “Not sure”
                              </span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                </ul>
                <div className="mt-5 flex flex-wrap gap-3">
                  {previewHref && (
                    <Link
                      href={previewHref}
                      target="_blank"
                      className="rounded-md bg-[#B1502F] px-4 py-2 text-sm font-medium text-white hover:bg-[#8F3F25]"
                    >
                      Preview the listing
                    </Link>
                  )}
                  <Link
                    href={propertyHref}
                    className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                  >
                    Back to the property
                  </Link>
                </div>
              </section>
            </div>

            <div className="sticky bottom-0 -mx-4 mt-4 flex items-center justify-between gap-3 border-t border-stone-200 bg-[#FBF0E1] px-4 py-3 md:static md:mx-0 md:border-0 md:bg-transparent md:px-0">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => go(keys[index - 1])}
                className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40"
              >
                ← Back
              </button>
              {index < keys.length - 1 && (
                <button
                  type="button"
                  onClick={() => go(keys[index + 1])}
                  className="rounded-md bg-[#B1502F] px-4 py-2 text-sm font-medium text-white hover:bg-[#8F3F25]"
                >
                  Next: {titleOf(keys[index + 1])} →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProgressContext.Provider>
  );
}
