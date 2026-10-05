import { PROPERTY_STYLES } from "../details/catalog";
import type { QuestionRecord } from "../details/custom";
import { highlights } from "../details/format";
import type { Details } from "../details/schema";
import type { ListingFacts } from "./types";

// Structurally typed so tests can build one without Prisma.
export type FactsInput = {
  property: {
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string;
    zip: string;
    buildYear: number;
    propertyStyle: string | null;
    neighborhoodBlurb: string | null;
    publicContactEmail: string | null;
    publicContactPhone: string | null;
  };
  unit: {
    name: string;
    rentAmountCents: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    squareFeet: number | null;
    dateAvailable: Date | null;
    isFurnished: boolean | null;
    smokingAllowed: boolean | null;
    parkingType: string | null;
    details: unknown;
  };
  listing: {
    headline: string | null;
    previewMessage: string | null;
    story: string;
    leaseTerm: string | null;
  };
  amenities: { label: string; category: string }[];
  petPolicies: { petType: string; petSize: string | null; allowed: boolean }[];
  fees: { type: string; amountCents: number | null }[];
  utilities: { type: string; included: boolean }[];
  questions?: QuestionRecord[];
  permitNumber?: string | null;
};

const PARKING: Record<string, string> = {
  GARAGE_ATTACHED: "Attached garage",
  GARAGE_LOT: "Detached garage",
  COVERED_LOT: "Covered parking",
  STREET: "Street parking",
  SURFACE_LOT: "Off-street parking",
  OTHER: "Parking available",
  NONE: "No parking",
};

const UTILITY: Record<string, string> = {
  WATER: "water",
  GAS: "gas",
  ELECTRIC: "electric",
  TRASH: "trash",
  SEWER: "sewer",
  INTERNET: "internet",
  CABLE: "cable",
  OTHER: "other utilities",
};

const HEAT: Record<string, string> = {
  "forced-air": "Forced air",
  steam: "Steam radiators",
  "hot-water": "Hot-water radiators",
  baseboard: "Baseboard",
};

const COOLING: Record<string, string> = {
  central: "Central air",
  "window-units": "Window air conditioners",
  "mini-split": "Mini-split",
};

const join = (items: string[]) =>
  items.length <= 2
    ? items.join(" and ")
    : `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;

export function buildFacts(input: FactsInput): ListingFacts {
  const { property, unit, listing } = input;
  const details = (unit.details as Details | null) ?? null;
  const get = (key: keyof Details) =>
    (details?.[key] as Record<string, unknown> | undefined) ?? {};

  const styleLabel =
    {
      rowhouse: "rowhouse",
      "semi-detached": "semi-detached house",
      detached: "house",
      victorian: "Victorian house",
      farmhouse: "farmhouse",
      "carriage-house": "carriage house",
      converted: "converted building",
    }[property.propertyStyle ?? ""] ?? "house";

  // Laundry in the vocabulary the sites use, and as a sentence.
  const laundry = get("laundry");
  const where = typeof laundry.location === "string" ? laundry.location : null;
  const washer = laundry.washerHookup === "yes";
  const dryer = typeof laundry.dryer === "string" && laundry.dryer !== "none";
  let laundryShort: string | null = null;
  let laundryText: string | null = null;
  if (where === "none") {
    laundryShort = "No laundry";
    laundryText = "No laundry hookups";
  } else if (washer || dryer) {
    laundryShort = "W/D hookups";
    const parts = [
      washer ? "washer hookup" : null,
      dryer
        ? `${laundry.dryer === "vent-only" ? "dryer vent" : `${laundry.dryer} dryer hookup`}`
        : null,
    ].filter(Boolean) as string[];
    laundryText = `${join(parts)}${where ? `, in the ${where === "bathroom" ? "bathroom" : where}` : ""}`;
    laundryText = laundryText.charAt(0).toUpperCase() + laundryText.slice(1);
  }

  const systems = get("systems");
  const heatKey = typeof systems.heat === "string" ? systems.heat : "";
  const fuel =
    typeof systems.heatFuel === "string" && systems.heatFuel !== "unsure"
      ? systems.heatFuel
      : null;
  const heat = HEAT[heatKey] ? `${HEAT[heatKey]}${fuel ? ` (${fuel})` : ""}` : null;
  const coolKey = typeof systems.cooling === "string" ? systems.cooling : "";
  const cooling = COOLING[coolKey] ?? (coolKey === "none" ? "No air conditioning" : null);

  const energy = get("energy");
  const evCharging = ["outlet-240", "charger"].includes(String(energy.evCharging));

  const pet = (type: string) => {
    const rows = input.petPolicies.filter((p) => p.petType === type);
    if (rows.length === 0) return null;
    return rows.some((r) => r.allowed);
  };
  const cats = pet("CATS");
  const dogs = pet("DOGS");
  const petBits = [
    cats === null ? null : cats ? "cats allowed" : "no cats",
    dogs === null ? null : dogs ? "dogs allowed" : "no dogs",
  ].filter(Boolean) as string[];

  const included = input.utilities
    .filter((u) => u.included)
    .map((u) => UTILITY[u.type] ?? u.type.toLowerCase());
  const tenant = input.utilities
    .filter((u) => !u.included)
    .map((u) => UTILITY[u.type] ?? u.type.toLowerCase());
  const utilitiesText =
    included.length || tenant.length
      ? [
          included.length ? `${cap(join(included))} included` : null,
          tenant.length ? `tenant sets up ${join(tenant)}` : null,
        ]
          .filter(Boolean)
          .join("; ")
      : null;

  const fee = (type: string) =>
    input.fees.find((f) => f.type === type)?.amountCents ?? null;
  const glance = highlights(details, input.questions ?? []);

  return {
    headline: listing.headline?.trim() || unit.name,
    preview: listing.previewMessage?.trim() || null,
    story: listing.story
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean),
    address: {
      line1: property.addressLine1,
      line2: property.addressLine2,
      city: property.city,
      state: property.state,
      zip: property.zip,
    },
    neighborhood: property.neighborhoodBlurb?.trim() || null,
    buildYear: property.buildYear,
    styleLabel,
    propertyStyle: property.propertyStyle,
    unitName: unit.name,
    rentCents: unit.rentAmountCents,
    bedrooms: unit.bedrooms,
    bathrooms: unit.bathrooms,
    squareFeet: unit.squareFeet,
    dateAvailable: unit.dateAvailable,
    leaseTerm: listing.leaseTerm?.trim() || null,
    furnished: unit.isFurnished,
    smokingAllowed: unit.smokingAllowed,
    parking: unit.parkingType ? (PARKING[unit.parkingType] ?? null) : null,
    laundry: laundryShort,
    laundryText,
    heat,
    cooling,
    hasAirConditioning:
      coolKey === "" ? null : ["central", "window-units", "mini-split"].includes(coolKey),
    evCharging,
    pets: { cats, dogs, text: petBits.length ? cap(petBits.join(", ")) : null },
    utilitiesText,
    depositCents: fee("SECURITY_DEPOSIT"),
    applicationFeeCents: fee("APPLICATION_FEE"),
    appliances: input.amenities
      .filter((a) => a.category === "APPLIANCE")
      .map((a) => a.label),
    amenities: input.amenities
      .filter((a) => a.category !== "APPLIANCE")
      .map((a) => a.label),
    highlights: glance.highlights,
    quirks: glance.quirks,
    contactEmail: property.publicContactEmail?.trim() || null,
    contactPhone: property.publicContactPhone?.trim() || null,
    permitNumber: input.permitNumber ?? null,
  };
}

const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export { PROPERTY_STYLES };
