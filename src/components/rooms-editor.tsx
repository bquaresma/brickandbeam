"use client";

import { useState } from "react";

import { FieldInput } from "@/components/field-input";
import { saveRooms } from "@/lib/actions/details";
import { ROOM_FIELDS } from "@/lib/details/catalog";
import type { Room } from "@/lib/details/schema";

type Status =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "error"; message: string };

// Room-by-room editor: the structure that lets a non-conforming attic or a
// carriage-house bedroom be described honestly instead of squeezed into a
// bed/bath count.
export function RoomsEditor({
  propertyId,
  unitId,
  initialRooms,
}: {
  propertyId: string;
  unitId: string;
  initialRooms: Room[];
}) {
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const update = (index: number, key: string, value: unknown) => {
    setRooms((all) => all.map((r, i) => (i === index ? { ...r, [key]: value } : r)));
    if (status.kind === "saved") setStatus({ kind: "idle" });
  };

  async function save() {
    setStatus({ kind: "saving" });
    const result = await saveRooms(propertyId, unitId, rooms);
    setStatus(
      result?.error ? { kind: "error", message: result.error } : { kind: "saved" },
    );
  }

  return (
    <div>
      <div className="space-y-4">
        {rooms.map((room, index) => {
          const isBedroom =
            room.type === "bedroom" || room.type === "non-conforming-bedroom";
          return (
            <div
              key={room.id}
              className="rounded-md border border-stone-200 bg-stone-50 p-4"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {ROOM_FIELDS.filter((f) => f.key !== "countsAsBedroom" || isBedroom).map(
                  (field) => (
                    <div
                      key={field.key}
                      className={
                        (field.type === "text" && field.multiline) ||
                        field.type === "tags"
                          ? "col-span-full"
                          : undefined
                      }
                    >
                      <FieldInput
                        id={`room-${room.id}-${field.key}`}
                        field={field}
                        value={(room as Record<string, unknown>)[field.key]}
                        onChange={(next) => update(index, field.key, next)}
                      />
                    </div>
                  ),
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setRooms((all) => all.filter((_, i) => i !== index));
                  setStatus({ kind: "idle" });
                }}
                className="mt-3 rounded border border-red-200 px-3 py-2 text-xs text-red-700 hover:bg-red-50"
              >
                Remove this room
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setRooms((all) => [
              ...all,
              { id: crypto.randomUUID().replace(/-/g, "").slice(0, 12), name: "" },
            ]);
            setStatus({ kind: "idle" });
          }}
          className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          + Add a room
        </button>
        <button
          type="button"
          onClick={save}
          disabled={status.kind === "saving"}
          className="rounded-md bg-[#B1502F] px-4 py-2 text-sm font-medium text-white hover:bg-[#8F3F25] disabled:opacity-50"
        >
          {status.kind === "saving" ? "Saving…" : "Save rooms"}
        </button>
        <p role="status" className="text-sm">
          {status.kind === "saved" && <span className="text-green-700">Saved</span>}
          {status.kind === "error" && (
            <span className="text-red-600">{status.message}</span>
          )}
        </p>
      </div>
    </div>
  );
}
