"use client";

import { useState } from "react";

import { PanoramaIcon } from "@/components/listing-icons";
import { parseLatLng } from "@/lib/geocode";

function openStreetView(
  preview: Window | null,
  { lat, lng }: { lat: number; lng: number },
) {
  const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
  if (preview) {
    preview.location.href = streetViewUrl;
  } else {
    // Popup blocked even on the synchronous open (strict blocker settings)
    // — fall back to this tab so the check isn't a dead end.
    window.location.href = streetViewUrl;
  }
}

// Lets a landlord confirm a Street View actually lands on the right spot
// before publishing — reads the current value of the given form fields at
// click time (works whether they're controlled or plain inputs), accepts
// either a free-text address or a pasted "lat,lng" pair, geocodes text
// client-side with the same Mapbox token as the address autocomplete, and
// opens Google's Street View pano in a new tab.
export function StreetViewPreviewButton({
  fieldIds,
  label,
}: {
  fieldIds: string[];
  label: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "empty">("idle");

  async function handleClick() {
    const address = fieldIds
      .map((id) =>
        (document.getElementById(id) as HTMLInputElement | null)?.value?.trim(),
      )
      .filter(Boolean)
      .join(", ");

    if (!address) {
      setStatus("empty");
      return;
    }

    const direct = parseLatLng(address);
    if (direct) {
      // Same-tick open — see the note below for why this matters.
      const preview = window.open("about:blank", "_blank");
      openStreetView(preview, direct);
      setStatus("idle");
      return;
    }

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      setStatus("error");
      return;
    }

    // Open the tab synchronously, in the same tick as the click, then
    // navigate it once geocoding resolves — a window.open() after an
    // `await` loses the user-gesture context and gets popup-blocked in
    // most browsers, even though this click itself is genuine.
    const preview = window.open("about:blank", "_blank");

    setStatus("loading");
    try {
      const url = new URL("https://api.mapbox.com/search/geocode/v6/forward");
      url.searchParams.set("q", address);
      url.searchParams.set("country", "US");
      url.searchParams.set("limit", "1");
      url.searchParams.set("access_token", token);

      const res = await fetch(url.toString());
      const data: { features?: { geometry?: { coordinates?: unknown } }[] } =
        await res.json();
      const coords = data.features?.[0]?.geometry?.coordinates;
      if (!Array.isArray(coords) || coords.length !== 2) {
        preview?.close();
        setStatus("error");
        return;
      }
      const [lng, lat] = coords;
      openStreetView(preview, { lat, lng });
      setStatus("idle");
    } catch {
      preview?.close();
      setStatus("error");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={status === "loading"}
        className="flex items-center gap-1.5 text-xs font-medium text-[#B1502F] hover:underline disabled:opacity-50"
      >
        <PanoramaIcon className="h-3.5 w-3.5" />
        {status === "loading" ? "Finding it…" : label}
      </button>
      {status === "error" && (
        <span className="text-xs text-red-600">Couldn&apos;t find that address.</span>
      )}
      {status === "empty" && (
        <span className="text-xs text-stone-500">Enter an address first.</span>
      )}
    </div>
  );
}
