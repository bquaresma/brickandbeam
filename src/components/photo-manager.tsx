"use client";

import { useRef, useState, useTransition } from "react";

import { deletePhoto, movePhoto, setHeroPhoto, updatePhoto } from "@/lib/actions/photos";
import { HEIC_MESSAGE } from "@/lib/images/formats";
import {
  altFor,
  AREA_LABELS,
  PHOTO_AREAS,
  smallestUrl,
  type PhotoAreaName,
  type PhotoView,
} from "@/lib/images/view";

type Upload = {
  id: number;
  name: string;
  progress: number;
  status: "queued" | "uploading" | "error";
  error?: string;
};

const ACCEPT = "image/jpeg,image/png,image/webp";
const looksLikeHeic = (file: File) =>
  /image\/hei[cf]/.test(file.type) || /\.(heic|heif)$/i.test(file.name);

// XHR rather than fetch so each file reports real upload progress.
function sendFile(
  file: File,
  fields: Record<string, string>,
  onProgress: (fraction: number) => void,
): Promise<{ photo?: PhotoView; error?: string }> {
  return new Promise((resolve) => {
    const body = new FormData();
    body.set("file", file);
    for (const [key, value] of Object.entries(fields)) body.set(key, value);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/uploads");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onerror = () =>
      resolve({ error: "The upload was interrupted. Check your connection." });
    xhr.onload = () => {
      try {
        resolve(JSON.parse(xhr.responseText));
      } catch {
        resolve({ error: "The server sent an unexpected response." });
      }
    };
    xhr.send(body);
  });
}

export function PhotoManager({
  listingId,
  initialPhotos,
}: {
  listingId: string;
  initialPhotos: PhotoView[];
}) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [uploadArea, setUploadArea] = useState<PhotoAreaName>("EXTERIOR");
  const [message, setMessage] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(0);
  const busy = useRef(false);

  const patch = (id: string, changes: Partial<PhotoView>) =>
    setPhotos((all) => all.map((p) => (p.id === id ? { ...p, ...changes } : p)));

  async function run(action: () => Promise<{ error: string } | undefined>) {
    setMessage(null);
    const result = await action();
    if (result?.error) setMessage(result.error);
  }

  // One photo at a time: conversion is heavy and the server runs one at once anyway.
  async function addFiles(files: File[]) {
    const items: Upload[] = files.map((file) => ({
      id: nextId.current++,
      name: file.name,
      progress: 0,
      status: "queued",
    }));
    setUploads((current) => [...current, ...items]);
    if (busy.current) return;
    busy.current = true;

    const setItem = (id: number, changes: Partial<Upload>) =>
      setUploads((all) => all.map((u) => (u.id === id ? { ...u, ...changes } : u)));
    const drop = (id: number) => setUploads((all) => all.filter((u) => u.id !== id));

    for (const [index, file] of files.entries()) {
      const id = items[index].id;
      if (looksLikeHeic(file)) {
        setItem(id, { status: "error", error: HEIC_MESSAGE });
        continue;
      }
      setItem(id, { status: "uploading" });
      const result = await sendFile(
        file,
        { listingId, area: uploadArea, kind: "PHOTO" },
        (f) => setItem(id, { progress: f }),
      );
      if (result.photo) {
        setPhotos((all) => [...all, result.photo!]);
        drop(id);
      } else {
        setItem(id, { status: "error", error: result.error ?? "Upload failed." });
      }
    }
    busy.current = false;
  }

  const regular = photos
    .filter((p) => p.kind === "PHOTO")
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-[#3D2E24]">Photos</h2>
      <p className="mt-1 text-sm text-stone-500">
        Upload JPEG, PNG or WebP. Each photo is converted to fast, mobile-friendly sizes
        and its location data is removed. The first photo becomes the hero image.
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void addFiles(Array.from(e.dataTransfer.files));
        }}
        className={`mt-4 rounded-lg border-2 border-dashed p-6 text-center ${
          dragging ? "border-[#B1502F] bg-orange-50" : "border-stone-300 bg-white"
        }`}
      >
        <label className="text-sm text-stone-600">
          New photos show:{" "}
          <select
            value={uploadArea}
            onChange={(e) => setUploadArea(e.target.value as PhotoAreaName)}
            className="rounded-md border border-stone-300 px-2 py-1 text-sm"
          >
            {PHOTO_AREAS.map((area) => (
              <option key={area} value={area}>
                {AREA_LABELS[area]}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-md bg-[#B1502F] px-4 py-2 text-sm font-medium text-white hover:bg-[#8F3F25]"
          >
            Choose photos
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="sr-only"
            aria-label="Choose photos to upload"
            onChange={(e) => {
              void addFiles(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
          <p className="mt-2 text-xs text-stone-500">or drag them here</p>
        </div>
      </div>

      {uploads.length > 0 && (
        <ul className="mt-3 space-y-2" aria-live="polite">
          {uploads.map((u) => (
            <li
              key={u.id}
              className="rounded-md border border-stone-200 bg-white p-3 text-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="truncate font-medium text-stone-700">{u.name}</span>
                <span className="shrink-0 text-xs text-stone-500">
                  {u.status === "queued" && "Waiting…"}
                  {u.status === "uploading" &&
                    (u.progress < 1
                      ? `Uploading ${Math.round(u.progress * 100)}%`
                      : "Converting…")}
                  {u.status === "error" && "Failed"}
                </span>
              </div>
              {u.status === "uploading" && (
                <div className="mt-2 h-1.5 overflow-hidden rounded bg-stone-100">
                  <div
                    className="h-full bg-[#B1502F] transition-all"
                    style={{ width: `${Math.round(u.progress * 100)}%` }}
                  />
                </div>
              )}
              {u.status === "error" && (
                <p className="mt-1 text-red-600">
                  {u.error}{" "}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => setUploads((all) => all.filter((x) => x.id !== u.id))}
                  >
                    Dismiss
                  </button>
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {message && <p className="mt-3 text-sm text-red-600">{message}</p>}

      {regular.length > 0 && (
        <ul className="mt-6 space-y-3">
          {regular.map((photo, index) => (
            <li
              key={photo.id}
              className="flex gap-4 rounded-lg border border-stone-200 bg-white p-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={smallestUrl(photo.variants)}
                alt={altFor(photo)}
                width={photo.width}
                height={photo.height}
                className="h-24 w-32 shrink-0 rounded-md bg-stone-100 object-cover"
                style={
                  photo.placeholder
                    ? { backgroundImage: `url(${photo.placeholder})` }
                    : undefined
                }
              />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label="What this photo shows"
                    value={photo.area}
                    onChange={(e) => {
                      const area = e.target.value as PhotoAreaName;
                      patch(photo.id, { area });
                      const fd = new FormData();
                      fd.set("area", area);
                      fd.set("caption", photo.caption ?? "");
                      fd.set("altText", photo.altText ?? "");
                      startTransition(() => void run(() => updatePhoto(photo.id, fd)));
                    }}
                    className="rounded-md border border-stone-300 px-2 py-1 text-sm"
                  >
                    {PHOTO_AREAS.map((area) => (
                      <option key={area} value={area}>
                        {AREA_LABELS[area]}
                      </option>
                    ))}
                  </select>
                  {photo.isHero ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      Hero image
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="text-xs text-[#B1502F] underline"
                      onClick={() => {
                        setPhotos((all) =>
                          all.map((p) => ({ ...p, isHero: p.id === photo.id })),
                        );
                        startTransition(() => void run(() => setHeroPhoto(photo.id)));
                      }}
                    >
                      Make hero
                    </button>
                  )}
                  <span className="ml-auto flex gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      aria-label="Move earlier"
                      className="rounded border border-stone-300 px-2 py-0.5 text-xs disabled:opacity-30"
                      onClick={() => {
                        setPhotos((all) => swap(all, photo.id, "up"));
                        startTransition(() => void run(() => movePhoto(photo.id, "up")));
                      }}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={index === regular.length - 1}
                      aria-label="Move later"
                      className="rounded border border-stone-300 px-2 py-0.5 text-xs disabled:opacity-30"
                      onClick={() => {
                        setPhotos((all) => swap(all, photo.id, "down"));
                        startTransition(
                          () => void run(() => movePhoto(photo.id, "down")),
                        );
                      }}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-700 hover:bg-red-50"
                      onClick={() => {
                        if (!confirm("Delete this photo?")) return;
                        setPhotos((all) => all.filter((p) => p.id !== photo.id));
                        startTransition(() => void run(() => deletePhoto(photo.id)));
                      }}
                    >
                      Delete
                    </button>
                  </span>
                </div>
                <input
                  type="text"
                  aria-label="Caption"
                  placeholder="Caption (optional)"
                  defaultValue={photo.caption ?? ""}
                  maxLength={200}
                  onBlur={(e) => saveText(photo, { caption: e.target.value })}
                  className="block w-full rounded-md border border-stone-300 px-2 py-1 text-sm"
                />
                <input
                  type="text"
                  aria-label="Alt text for screen readers"
                  placeholder={`Alt text — describes the photo for screen readers (default: ${AREA_LABELS[photo.area]})`}
                  defaultValue={photo.altText ?? ""}
                  maxLength={300}
                  onBlur={(e) => saveText(photo, { altText: e.target.value })}
                  className="block w-full rounded-md border border-stone-300 px-2 py-1 text-sm"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  function saveText(photo: PhotoView, changes: { caption?: string; altText?: string }) {
    const caption = changes.caption ?? photo.caption ?? "";
    const altText = changes.altText ?? photo.altText ?? "";
    if (caption === (photo.caption ?? "") && altText === (photo.altText ?? "")) return;
    patch(photo.id, { caption: caption || null, altText: altText || null });
    const fd = new FormData();
    fd.set("area", photo.area);
    fd.set("caption", caption);
    fd.set("altText", altText);
    startTransition(() => void run(() => updatePhoto(photo.id, fd)));
  }
}

// Swap a photo with its same-kind neighbour in the local list.
function swap(all: PhotoView[], id: string, direction: "up" | "down"): PhotoView[] {
  const sorted = all
    .filter((p) => p.kind === "PHOTO")
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const index = sorted.findIndex((p) => p.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= sorted.length) return all;
  const a = sorted[index];
  const b = sorted[target];
  return all.map((p) =>
    p.id === a.id
      ? { ...p, sortOrder: b.sortOrder }
      : p.id === b.id
        ? { ...p, sortOrder: a.sortOrder }
        : p,
  );
}
