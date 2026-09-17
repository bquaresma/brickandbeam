// Server-side geocoding for Street View deep links, which need real
// coordinates — Google's pano URL scheme silently ignores a free-text
// address in `viewpoint`, unlike its map search URL. Uses the same Mapbox
// public token as the client-side address autocomplete; Next.js inlines
// NEXT_PUBLIC_* vars at build time in server code too, so this works
// without any runtime env var. Also importable from client components
// (parseLatLng, no server-only APIs), for the same "lat,lng or address"
// input handling in the Street View preview button.
export type GeocodeResult = { lat: number; lng: number };

const LAT_LNG_RE = /^(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)$/;

// Alleys and service streets often don't have a real geocodable address, so
// a landlord can paste coordinates directly (e.g. from Google Maps' "Copy
// coordinates") instead of typing a description and hoping it resolves.
export function parseLatLng(input: string): GeocodeResult | null {
  const match = LAT_LNG_RE.exec(input.trim());
  if (!match) return null;

  const lat = Number.parseFloat(match[1]);
  const lng = Number.parseFloat(match[2]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return { lat, lng };
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const trimmed = address.trim();
  if (!trimmed) return null;

  const direct = parseLatLng(trimmed);
  if (direct) return direct;

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;

  try {
    const url = new URL("https://api.mapbox.com/search/geocode/v6/forward");
    url.searchParams.set("q", trimmed);
    url.searchParams.set("country", "US");
    url.searchParams.set("limit", "1");
    url.searchParams.set("access_token", token);

    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const data: { features?: { geometry?: { coordinates?: unknown } }[] } =
      await res.json();
    const coords = data.features?.[0]?.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length !== 2) return null;
    const [lng, lat] = coords;
    if (typeof lat !== "number" || typeof lng !== "number") return null;
    return { lat, lng };
  } catch {
    return null;
  }
}
