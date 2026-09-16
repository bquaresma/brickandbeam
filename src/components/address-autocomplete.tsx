"use client";

import { useEffect, useRef, useState } from "react";

type Suggestion = {
  id: string;
  fullAddress: string;
  addressLine1: string;
  city: string;
  state: string;
  zip: string;
};

type MapboxFeature = {
  properties?: {
    mapbox_id?: string;
    full_address?: string;
    name?: string;
    context?: {
      place?: { name?: string };
      region?: { region_code?: string };
      postcode?: { name?: string };
    };
  };
};

function parseFeature(feature: MapboxFeature): Suggestion | null {
  const props = feature.properties;
  if (!props?.mapbox_id) return null;
  const context = props.context ?? {};
  return {
    id: props.mapbox_id,
    fullAddress: props.full_address ?? props.name ?? "",
    addressLine1: props.name ?? "",
    city: context.place?.name ?? "",
    state: context.region?.region_code ?? "",
    zip: context.postcode?.name ?? "",
  };
}

// Address line 1 + city/state/zip as one unit: typing into the address
// field debounces into a Mapbox Geocoding v6 autocomplete call, and picking
// a suggestion fills the sibling fields. Degrades to plain text inputs with
// no dropdown if NEXT_PUBLIC_MAPBOX_TOKEN isn't set or the request fails —
// the fields keep their `name`s either way, so the form works unchanged.
export function AddressAutocomplete({
  defaultAddressLine1,
  defaultCity,
  defaultState,
  defaultZip,
}: {
  defaultAddressLine1?: string;
  defaultCity?: string;
  defaultState?: string;
  defaultZip?: string;
}) {
  const [addressLine1, setAddressLine1] = useState(defaultAddressLine1 ?? "");
  const [city, setCity] = useState(defaultCity ?? "");
  const [state, setState] = useState(defaultState ?? "");
  const [zip, setZip] = useState(defaultZip ?? "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextFetch = useRef(false);

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (!token || addressLine1.trim().length < 4) {
        setSuggestions([]);
        return;
      }

      try {
        const url = new URL("https://api.mapbox.com/search/geocode/v6/forward");
        url.searchParams.set("q", addressLine1);
        url.searchParams.set("autocomplete", "true");
        url.searchParams.set("types", "address");
        url.searchParams.set("country", "US");
        url.searchParams.set("limit", "5");
        url.searchParams.set("access_token", token);

        const res = await fetch(url.toString());
        if (!res.ok) return;
        const data: { features?: MapboxFeature[] } = await res.json();
        const parsed = (data.features ?? [])
          .map(parseFeature)
          .filter((s): s is Suggestion => s !== null);
        setSuggestions(parsed);
        setOpen(parsed.length > 0);
      } catch {
        // Network hiccup — the plain inputs still work without suggestions.
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [addressLine1]);

  function pick(suggestion: Suggestion) {
    skipNextFetch.current = true;
    setAddressLine1(suggestion.addressLine1);
    setCity(suggestion.city);
    setState(suggestion.state);
    setZip(suggestion.zip);
    setSuggestions([]);
    setOpen(false);
  }

  return (
    <>
      <div className="relative">
        <label
          htmlFor="addressLine1"
          className="block text-sm font-medium text-stone-700"
        >
          Address line 1
        </label>
        <input
          id="addressLine1"
          name="addressLine1"
          type="text"
          required
          autoComplete="off"
          value={addressLine1}
          onChange={(e) => setAddressLine1(e.target.value)}
          onFocus={() => setOpen(suggestions.length > 0)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-[#B1502F] focus:outline-none"
        />
        {open && (
          <ul className="absolute z-10 mt-1 w-full rounded-md border border-stone-200 bg-white text-sm shadow-lg">
            {suggestions.map((suggestion) => (
              <li key={suggestion.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(suggestion)}
                  className="block w-full px-3 py-2 text-left hover:bg-stone-50"
                >
                  {suggestion.fullAddress}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1">
          <label htmlFor="city" className="block text-sm font-medium text-stone-700">
            City
          </label>
          <input
            id="city"
            name="city"
            type="text"
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-[#B1502F] focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-stone-700">
            State
          </label>
          <input
            id="state"
            name="state"
            type="text"
            required
            maxLength={2}
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm uppercase focus:border-[#B1502F] focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="zip" className="block text-sm font-medium text-stone-700">
            Zip
          </label>
          <input
            id="zip"
            name="zip"
            type="text"
            required
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-[#B1502F] focus:outline-none"
          />
        </div>
      </div>
    </>
  );
}
