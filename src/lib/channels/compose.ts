import { requiresLeadPaintDisclosure } from "../compliance";
import type { ListingFacts } from "./types";

export const EQUAL_HOUSING = "Equal Housing Opportunity.";

export const money = (cents: number | null) =>
  cents == null
    ? ""
    : `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

// Stored as a UTC date, so format in UTC or it can slip a day.
export const dateText = (date: Date | null) =>
  date
    ? date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      })
    : "";

const num = (n: number | null) => (n == null ? "" : String(n));

export const bedBath = (f: ListingFacts) =>
  [
    f.bedrooms != null
      ? `${f.bedrooms} ${f.bedrooms === 1 ? "bedroom" : "bedrooms"}`
      : null,
    f.bathrooms != null
      ? `${f.bathrooms} ${f.bathrooms === 1 ? "bathroom" : "bathrooms"}`
      : null,
    f.squareFeet != null ? `${f.squareFeet.toLocaleString("en-US")} sq ft` : null,
  ]
    .filter(Boolean)
    .join(" · ");

// Added to every ad for a pre-1978 house.
export function leadNotice(f: ListingFacts): string | null {
  if (!requiresLeadPaintDisclosure(f.buildYear)) return null;
  return `Built in ${f.buildYear}. Homes built before 1978 may contain lead-based paint; a lead hazard disclosure and the EPA pamphlet are provided before any lease is signed.`;
}

export function contactLine(f: ListingFacts): string | null {
  const how = [
    f.contactEmail ? `email ${f.contactEmail}` : null,
    f.contactPhone ? `call or text ${f.contactPhone}` : null,
  ]
    .filter(Boolean)
    .join(" or ");
  return how ? `To arrange a showing, ${how}.` : null;
}

// The footer every ad ends with: required disclosures first, then the equal
// housing line.
export function footer(f: ListingFacts): string {
  return [
    leadNotice(f),
    f.permitNumber ? `Rental permit no. ${f.permitNumber}.` : null,
    EQUAL_HOUSING,
  ]
    .filter(Boolean)
    .join("\n");
}

const cutAtWord = (text: string, max: number) => {
  if (text.length <= max) return text;
  const slice = text.slice(0, max - 1);
  const space = slice.lastIndexOf(" ");
  return `${(space > max * 0.6 ? slice.slice(0, space) : slice).replace(/[\s,;:–—-]+$/, "")}…`;
};

// "3-bedroom rowhouse with original hardwood, pocket doors", trimmed to fit.
export function adTitle(f: ListingFacts, max: number): string {
  const base = f.bedrooms != null ? `${f.bedrooms}-bedroom ${f.styleLabel}` : f.headline;
  const feature = f.highlights
    .filter((h) => !/basement|internet|laundry/i.test(h))
    .slice(0, 2)
    .map((h) => h.charAt(0).toLowerCase() + h.slice(1));
  const full = feature.length ? `${base} with ${feature.join(", ")}` : base;
  return cutAtWord(full.charAt(0).toUpperCase() + full.slice(1), max);
}

export function detailBullets(f: ListingFacts): string[] {
  const lines: (string | null)[] = [
    f.rentCents != null ? `Rent: ${money(f.rentCents)} per month` : null,
    bedBath(f) || null,
    f.dateAvailable
      ? `Available ${dateText(f.dateAvailable)}${f.leaseTerm ? `, ${f.leaseTerm} lease` : ""}`
      : f.leaseTerm
        ? `Lease: ${f.leaseTerm}`
        : null,
    f.heat ? `Heat: ${f.heat}` : null,
    f.cooling ? `Cooling: ${f.cooling}` : null,
    f.laundryText ? `Laundry: ${f.laundryText}` : null,
    f.parking ? `Parking: ${f.parking}` : null,
    f.evCharging ? "EV charging available" : null,
    f.utilitiesText ? `Utilities: ${f.utilitiesText}` : null,
    f.pets.text ? `Pets: ${f.pets.text}` : null,
    f.smokingAllowed === false ? "No smoking" : null,
    f.furnished ? "Furnished" : null,
    f.depositCents != null ? `Security deposit: ${money(f.depositCents)}` : null,
    f.applicationFeeCents != null
      ? `Application fee: ${money(f.applicationFeeCents)}`
      : null,
    f.appliances.length ? `Appliances: ${f.appliances.join(", ")}` : null,
  ];
  return lines.filter((l): l is string => !!l);
}

// Plain text, no emoji or markup: it pastes cleanly into every site's box.
export function describe(f: ListingFacts, length: "full" | "short"): string {
  const parts: string[] = [];
  const lead = f.preview ?? f.story[0] ?? f.headline;

  if (length === "short") {
    parts.push(cutAtWord(lead, 300));
    const bullets = detailBullets(f).filter((l) => /^(Rent|\d|Available)/.test(l));
    if (bullets.length) parts.push(bullets.join("\n"));
    if (f.highlights.length)
      parts.push(`Features: ${f.highlights.slice(0, 6).join(", ")}.`);
  } else {
    if (f.preview) parts.push(f.preview);
    parts.push(...f.story);
    const bullets = detailBullets(f);
    if (bullets.length)
      parts.push(["The details", ...bullets.map((b) => `- ${b}`)].join("\n"));
    if (f.highlights.length) parts.push(`Features: ${f.highlights.join(", ")}.`);
    if (f.quirks.length)
      parts.push(
        `Worth knowing: ${f.quirks.join(", ").replace(/^./, (c) => c.toLowerCase())}.`,
      );
    if (f.neighborhood) parts.push(f.neighborhood);
  }

  const contact = contactLine(f);
  if (contact) parts.push(contact);
  parts.push(footer(f));
  return parts.join("\n\n");
}

export const field = {
  num,
};
