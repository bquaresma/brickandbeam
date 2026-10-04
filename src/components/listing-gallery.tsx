"use client";

import { useEffect, useRef, useState } from "react";

import { ResponsivePicture } from "@/components/responsive-picture";
import { altFor, AREA_LABELS, PHOTO_AREAS, type PhotoView } from "@/lib/images/view";

// Hero image + a grid grouped by area + a keyboard-accessible lightbox.
export function ListingGallery({
  photos,
  legacyHeroUrl,
  fallbackAlt,
  emptyState,
  borderColor,
}: {
  photos: PhotoView[];
  legacyHeroUrl: string | null;
  fallbackAlt: string;
  emptyState: React.ReactNode;
  borderColor: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Hero first, then the rest in the landlord's order.
  const ordered = [...photos].sort(
    (a, b) => Number(b.isHero) - Number(a.isHero) || a.sortOrder - b.sortOrder,
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open !== null && !dialog.open) dialog.showModal();
    if (open === null && dialog.open) dialog.close();
  }, [open]);

  if (ordered.length === 0) {
    return legacyHeroUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={legacyHeroUrl}
        alt={fallbackAlt}
        className="aspect-video w-full rounded-xl border object-cover shadow-sm"
        style={{ borderColor }}
      />
    ) : (
      <>{emptyState}</>
    );
  }

  const rest = ordered.slice(1);
  const groups = PHOTO_AREAS.map((area) => ({
    area,
    items: rest.filter((p) => p.area === area),
  })).filter((g) => g.items.length > 0);
  const indexOf = (photo: PhotoView) => ordered.findIndex((p) => p.id === photo.id);
  const current = open !== null ? ordered[open] : null;
  const step = (delta: number) =>
    setOpen((i) => (i === null ? i : (i + delta + ordered.length) % ordered.length));

  const tile = (photo: PhotoView, hero = false) => (
    <button
      key={photo.id}
      type="button"
      onClick={() => setOpen(indexOf(photo))}
      aria-label={`Open photo: ${altFor(photo, "")}`}
      className="block w-full overflow-hidden rounded-xl border bg-white text-left shadow-sm focus:outline-2 focus:outline-offset-2"
      style={{ borderColor }}
    >
      <ResponsivePicture
        photo={photo}
        alt={altFor(photo, fallbackAlt ? ` — ${fallbackAlt}` : "")}
        sizes={
          hero ? "(min-width: 768px) 720px, 100vw" : "(min-width: 768px) 224px, 33vw"
        }
        priority={hero}
        className={`w-full object-cover ${hero ? "aspect-video" : "aspect-[4/3]"}`}
      />
    </button>
  );

  return (
    <div>
      {tile(ordered[0], true)}

      {groups.length > 0 && (
        <div className="mt-4 space-y-4">
          {groups.map((group) => (
            <div key={group.area}>
              {groups.length > 1 && (
                <h3 className="mb-2 text-xs font-semibold tracking-wide text-stone-500 uppercase">
                  {AREA_LABELS[group.area]}
                </h3>
              )}
              <div className="grid grid-cols-3 gap-3">
                {group.items.map((p) => tile(p))}
              </div>
            </div>
          ))}
        </div>
      )}

      <dialog
        ref={dialogRef}
        aria-label="Photo viewer"
        onClose={() => setOpen(null)}
        onClick={(e) => e.target === e.currentTarget && setOpen(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") step(-1);
          if (e.key === "ArrowRight") step(1);
        }}
        className="m-auto max-h-[95vh] w-full max-w-5xl rounded-xl bg-neutral-900 p-0 text-white backdrop:bg-black/80"
      >
        {current && (
          <div className="relative p-3">
            <button
              type="button"
              onClick={() => setOpen(null)}
              aria-label="Close"
              className="absolute top-4 right-4 z-10 rounded-full bg-black/60 px-3 py-1 text-sm"
            >
              ✕
            </button>
            <ResponsivePicture
              photo={current}
              alt={altFor(current, fallbackAlt ? ` — ${fallbackAlt}` : "")}
              sizes="(min-width: 1024px) 1000px, 100vw"
              priority
              className="mx-auto max-h-[80vh] w-auto max-w-full object-contain"
            />
            <div className="mt-2 flex items-center justify-between gap-3 text-sm">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous photo"
                className="rounded bg-white/10 px-3 py-1"
              >
                ←
              </button>
              <p className="text-center">
                {current.caption ? `${current.caption} · ` : ""}
                {(open ?? 0) + 1} of {ordered.length}
              </p>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next photo"
                className="rounded bg-white/10 px-3 py-1"
              >
                →
              </button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
