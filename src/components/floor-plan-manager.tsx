"use client";

import { useState } from "react";

import { deletePhoto } from "@/lib/actions/photos";
import { LEVELS } from "@/lib/details/catalog";
import { HEIC_MESSAGE } from "@/lib/images/formats";
import { smallestUrl, type PhotoView } from "@/lib/images/view";
import { IMAGE_ACCEPT, looksLikeHeic, sendFile } from "@/lib/upload-client";

type Slot = { uploading: boolean; progress: number; error?: string };

// One floor plan image per level. Uploading again for a level replaces it.
export function FloorPlanManager({
  listingId,
  initialPlans,
}: {
  listingId: string | null;
  initialPlans: PhotoView[];
}) {
  const [plans, setPlans] = useState(initialPlans);
  const [slots, setSlots] = useState<Record<string, Slot>>({});

  if (!listingId) {
    return (
      <p className="mt-3 rounded-md border border-dashed border-stone-300 bg-stone-50 p-4 text-sm text-stone-600">
        Create the listing first — floor plans are uploaded to it.
      </p>
    );
  }

  const setSlot = (level: string, slot: Slot | null) =>
    setSlots((all) => {
      const next = { ...all };
      if (slot) next[level] = slot;
      else delete next[level];
      return next;
    });

  async function upload(level: string, file: File) {
    if (looksLikeHeic(file)) {
      setSlot(level, { uploading: false, progress: 0, error: HEIC_MESSAGE });
      return;
    }
    setSlot(level, { uploading: true, progress: 0 });
    const result = await sendFile(
      file,
      { listingId: listingId!, kind: "FLOOR_PLAN", level },
      (progress) => setSlot(level, { uploading: true, progress }),
    );
    if (result.photo) {
      // The server removed the plan this one replaced.
      setPlans((all) => [...all.filter((p) => p.level !== level), result.photo!]);
      setSlot(level, null);
    } else {
      setSlot(level, {
        uploading: false,
        progress: 0,
        error: result.error ?? "Upload failed.",
      });
    }
  }

  return (
    <ul className="mt-3 divide-y divide-stone-200 rounded-md border border-stone-200 bg-white">
      {LEVELS.map((level) => {
        const plan = plans.find((p) => p.level === level);
        const slot = slots[level];
        const inputId = `plan-${level.replace(/\s+/g, "-").toLowerCase()}`;
        return (
          <li key={level} className="flex flex-wrap items-center gap-3 p-3">
            <span className="w-28 text-sm font-medium text-stone-700">{level}</span>
            {plan && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={smallestUrl(plan.variants)}
                alt={`${level} floor plan`}
                width={plan.width}
                height={plan.height}
                className="h-14 w-20 rounded border border-stone-200 bg-white object-contain"
              />
            )}
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <label
                htmlFor={inputId}
                className="cursor-pointer rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
              >
                {plan ? "Replace" : "Upload plan"}
              </label>
              <input
                id={inputId}
                type="file"
                accept={IMAGE_ACCEPT}
                className="sr-only"
                aria-label={`Upload ${level} floor plan`}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) void upload(level, file);
                }}
              />
              {plan && (
                <button
                  type="button"
                  className="rounded border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                  onClick={async () => {
                    if (!confirm(`Delete the ${level} floor plan?`)) return;
                    setPlans((all) => all.filter((p) => p.id !== plan.id));
                    await deletePhoto(plan.id);
                  }}
                >
                  Delete
                </button>
              )}
              {slot?.uploading && (
                <span className="text-xs text-stone-500" aria-live="polite">
                  {slot.progress < 1
                    ? `Uploading ${Math.round(slot.progress * 100)}%`
                    : "Converting…"}
                </span>
              )}
            </div>
            {slot?.error && (
              <p className="w-full text-sm text-red-600">
                {slot.error}{" "}
                <button
                  type="button"
                  className="underline"
                  onClick={() => setSlot(level, null)}
                >
                  Dismiss
                </button>
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
