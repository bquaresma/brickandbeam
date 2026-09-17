// Server-side geocoding for Street View deep links, which need real
// coordinates — Google's pano URL scheme silently ignores a free-text
// address in `viewpoint`, unlike its map search URL. Uses the same Mapbox
// public token as the client-side address autocomplete; Next.js inlines
// NEXT_PUBLIC_* vars at build time in server code too, so this works
// without any runtime env var.
export type GeocodeResult = { lat: number; lng: number };

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token || !address.trim()) return null;

  try {
    const url = new URL("https://api.mapbox.com/search/geocode/v6/forward");
    url.searchParams.set("q", address);
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
