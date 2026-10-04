"use client";

import { useEffect, useRef, useState } from "react";

import { ResponsivePicture } from "@/components/responsive-picture";
import { LEVELS, ROOM_TAGS, ROOM_TYPES } from "@/lib/details/catalog";
import { roomSize } from "@/lib/details/format";
import type { Room } from "@/lib/details/schema";
import type { PhotoView } from "@/lib/images/view";

const BRICK = "#9A4635";
const TIMBER = "#6B4A34";
const CHARCOAL = "#262626";

const typeLabel = (value?: string) => ROOM_TYPES.find((t) => t.value === value)?.label;
const tagLabel = (value: string) =>
  ROOM_TAGS.find((t) => t.value === value)?.label ?? value;

// "The house, room by room": a tab per floor, the plan image (zoomable), and a
// written legend of the rooms so the information doesn't depend on the image.
export function FloorPlans({ plans, rooms }: { plans: PhotoView[]; rooms: Room[] }) {
  const levelOf = (value: string | null | undefined) => value || "";
  const present = new Set([
    ...plans.map((p) => levelOf(p.level)),
    ...rooms.map((r) => levelOf(r.level)),
  ]);
  const ordered = [
    ...LEVELS.filter((l) => present.has(l)),
    ...[...present].filter((l) => l && !LEVELS.includes(l)),
    ...(present.has("") ? [""] : []),
  ];

  const [active, setActive] = useState(ordered[0] ?? "");
  const [enlarged, setEnlarged] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (enlarged && !dialog.open) dialog.showModal();
    if (!enlarged && dialog.open) dialog.close();
  }, [enlarged]);

  const plan = plans.find((p) => levelOf(p.level) === active);
  const roomsHere = rooms.filter((r) => levelOf(r.level) === active);
  const nameFor = (level: string) => level || "Other spaces";

  return (
    <div>
      {ordered.length > 1 && (
        <div role="tablist" aria-label="Floors" className="flex flex-wrap gap-2">
          {ordered.map((level) => (
            <button
              key={level || "other"}
              type="button"
              role="tab"
              aria-selected={level === active}
              onClick={() => setActive(level)}
              className="rounded-full border px-4 py-1.5 text-sm font-medium"
              style={
                level === active
                  ? { backgroundColor: BRICK, borderColor: BRICK, color: "#fff" }
                  : { borderColor: `${TIMBER}40`, color: TIMBER, backgroundColor: "#fff" }
              }
            >
              {nameFor(level)}
            </button>
          ))}
        </div>
      )}

      <div
        role={ordered.length > 1 ? "tabpanel" : undefined}
        aria-label={nameFor(active)}
        className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2"
      >
        {plan && (
          <figure>
            <button
              type="button"
              onClick={() => setEnlarged(true)}
              aria-label={`Enlarge the ${nameFor(active)} floor plan`}
              className="block w-full overflow-hidden rounded-lg border bg-white shadow-sm"
              style={{ borderColor: `${TIMBER}26` }}
            >
              <ResponsivePicture
                photo={plan}
                alt={`${nameFor(active)} floor plan`}
                sizes="(min-width: 768px) 360px, 100vw"
                className="h-auto w-full"
              />
            </button>
            <figcaption className="mt-2 text-xs" style={{ color: `${TIMBER}b3` }}>
              Approximate — not to scale. Tap to enlarge.
            </figcaption>
          </figure>
        )}

        {roomsHere.length > 0 && (
          <ul className={`space-y-3 ${plan ? "" : "md:col-span-2"}`}>
            {roomsHere.map((room) => (
              <li
                key={room.id}
                className="rounded-lg border bg-white p-4"
                style={{ borderColor: `${TIMBER}26` }}
              >
                <p className="flex flex-wrap items-baseline gap-x-2">
                  {room.marker && (
                    <span
                      className="inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-semibold text-white"
                      style={{ backgroundColor: BRICK }}
                      aria-label={`Marker ${room.marker}`}
                    >
                      {room.marker}
                    </span>
                  )}
                  <span
                    className="text-base font-medium"
                    style={{ fontFamily: "var(--font-spectral)", color: CHARCOAL }}
                  >
                    {room.name}
                  </span>
                  {roomSize(room) && (
                    <span className="text-sm" style={{ color: TIMBER }}>
                      {roomSize(room)}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs" style={{ color: `${TIMBER}b3` }}>
                  {[
                    typeLabel(room.type)?.toLowerCase() === room.name.trim().toLowerCase()
                      ? null
                      : typeLabel(room.type),
                    room.countsAsBedroom === "yes"
                      ? "Counts as a bedroom"
                      : room.countsAsBedroom === "no"
                        ? "Not counted as a bedroom"
                        : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {(room.ceilingNote || room.light) && (
                  <p className="mt-1 text-sm" style={{ color: "#3d342c" }}>
                    {[room.ceilingNote, room.light].filter(Boolean).join(". ")}
                  </p>
                )}
                {room.tags && room.tags.length > 0 && (
                  <p className="mt-1 text-sm" style={{ color: "#3d342c" }}>
                    {room.tags.map(tagLabel).join(" · ")}
                  </p>
                )}
                {room.notes && (
                  <p
                    className="mt-1 text-sm leading-relaxed"
                    style={{ color: "#3d342c" }}
                  >
                    {room.notes}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <dialog
        ref={dialogRef}
        aria-label={`${nameFor(active)} floor plan, enlarged`}
        onClose={() => setEnlarged(false)}
        onClick={(e) => e.target === e.currentTarget && setEnlarged(false)}
        className="m-auto max-h-[95vh] w-full max-w-5xl rounded-xl bg-white p-3 backdrop:bg-black/70"
      >
        {plan && enlarged && (
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span style={{ color: TIMBER }}>Approximate — not to scale</span>
              <button
                type="button"
                onClick={() => setEnlarged(false)}
                className="rounded border px-3 py-1"
                style={{ borderColor: `${TIMBER}40` }}
              >
                Close
              </button>
            </div>
            <div className="max-h-[80vh] overflow-auto">
              <ResponsivePicture
                photo={plan}
                alt={`${nameFor(active)} floor plan`}
                sizes="1800px"
                className="h-auto w-[1800px] max-w-none"
              />
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
