import { adTitle, bedBath, dateText, describe, money } from "./compose";
import type { ChannelKit, KitField, ListingFacts } from "./types";

const yesNo = (value: boolean | null, yes = "Yes", no = "No") =>
  value === null ? "" : value ? yes : no;
const n = (value: number | null) => (value == null ? "" : String(value));
const list = (items: string[]) => items.join(", ");

// Zillow's property types are House and Townhouse (among others).
const zillowType = (f: ListingFacts) =>
  f.propertyStyle === "rowhouse" || f.propertyStyle === "semi-detached"
    ? "Townhouse"
    : f.propertyStyle === "converted"
      ? "Other"
      : "House";

const addressLine = (f: ListingFacts) =>
  [f.address.line1, f.address.line2].filter(Boolean).join(", ");
const fullAddress = (f: ListingFacts) =>
  `${addressLine(f)}, ${f.address.city}, ${f.address.state} ${f.address.zip}`;

const description = (f: ListingFacts): KitField => ({
  label: "Description",
  value: describe(f, "full"),
  multiline: true,
  hint: "Includes the lead-paint notice (for a pre-1978 house) and the Equal Housing line.",
});

export function craigslistKit(f: ListingFacts): ChannelKit {
  return {
    id: "craigslist",
    name: "Craigslist",
    tagline:
      "Free for owners in most cities. Required: title, city or neighborhood, postal code, contact email.",
    openUrl: "https://www.craigslist.org/",
    openLabel: "Open Craigslist",
    fields: [
      {
        label: "Posting title",
        value: adTitle(f, 70),
        softLimit: 70,
        hint: "Craigslist shows the price and bedrooms beside the title, so they aren't repeated here.",
      },
      { label: "City or neighborhood", value: f.address.city },
      { label: "Postal code", value: f.address.zip },
      {
        label: "Rent per month",
        value: f.rentCents != null ? String(Math.round(f.rentCents / 100)) : "",
        hint: "Digits only.",
      },
      {
        label: "Housing type",
        value: f.propertyStyle === "rowhouse" ? "townhouse" : "house",
      },
      { label: "Bedrooms", value: n(f.bedrooms) },
      { label: "Bathrooms", value: n(f.bathrooms) },
      { label: "Square feet", value: n(f.squareFeet) },
      { label: "Available", value: dateText(f.dateAvailable) },
      { label: "Laundry", value: f.laundry ?? "" },
      { label: "Parking", value: f.parking ?? "" },
      { label: "Cats OK", value: yesNo(f.pets.cats) },
      { label: "Dogs OK", value: yesNo(f.pets.dogs) },
      { label: "Furnished", value: yesNo(f.furnished) },
      { label: "No smoking", value: f.smokingAllowed === false ? "Yes" : "" },
      { label: "EV charging", value: f.evCharging ? "Yes" : "" },
      { label: "Air conditioning", value: yesNo(f.hasAirConditioning) },
      {
        label: "Contact email",
        value: f.contactEmail ?? "",
        hint: "Use the leasing@ address, not your personal one.",
      },
      { label: "Contact phone", value: f.contactPhone ?? "" },
      description(f),
    ],
    photoNote:
      "Up to 24 photos. The first photo is the thumbnail, so upload the numbered zip in order.",
    notes: [
      "Post it yourself in the browser. Craigslist doesn't allow automated posting.",
      "Field names follow Craigslist's housing form as commonly described; the names on screen may differ slightly.",
    ],
  };
}

export function facebookKit(f: ListingFacts): ChannelKit {
  return {
    id: "facebook",
    name: "Facebook Marketplace",
    tagline: "Free, quick, strong local reach.",
    openUrl: "https://www.facebook.com/marketplace/create/rental",
    openLabel: "Open Marketplace",
    fields: [
      {
        label: "Title",
        value: adTitle(f, 100),
        softLimit: 100,
        hint: "The first words show in search results.",
      },
      { label: "Price per month", value: money(f.rentCents) },
      {
        label: "Property type",
        value: zillowType(f) === "Townhouse" ? "Townhouse" : "House",
      },
      { label: "Bedrooms", value: n(f.bedrooms) },
      { label: "Bathrooms", value: n(f.bathrooms) },
      { label: "Square feet", value: n(f.squareFeet) },
      { label: "Address", value: fullAddress(f) },
      { label: "Date available", value: dateText(f.dateAvailable) },
      { label: "Lease length", value: f.leaseTerm ?? "" },
      { label: "Laundry", value: f.laundryText ?? "" },
      { label: "Parking", value: f.parking ?? "" },
      { label: "Air conditioning", value: f.cooling ?? "" },
      { label: "Heating", value: f.heat ?? "" },
      { label: "Pets", value: f.pets.text ?? "" },
      description(f),
    ],
    photoNote:
      "Upload the numbered zip in order. Marketplace shows the first photo in search.",
    notes: [
      "If you also list on Zumper, it may republish to Marketplace: skip this one to avoid a duplicate.",
      "Field names follow the Marketplace rental form as commonly described; names on screen may differ.",
    ],
  };
}

export function facebookGroupKit(f: ListingFacts): ChannelKit {
  const intro = [
    `${adTitle(f, 100)}`,
    [
      f.rentCents != null ? `${money(f.rentCents)}/month` : null,
      f.dateAvailable ? `available ${dateText(f.dateAvailable)}` : null,
    ]
      .filter(Boolean)
      .join(", "),
  ]
    .filter(Boolean)
    .join(" — ");
  return {
    id: "facebook-group",
    name: "Facebook groups",
    tagline: "Neighborhood and rental groups. Best fit for a character home.",
    openUrl: "https://www.facebook.com/groups/feed/",
    openLabel: "Open Facebook groups",
    fields: [
      {
        label: "Post text",
        value: `${intro}\n\n${describe(f, "short")}`,
        multiline: true,
        hint: "A shorter version. Add the photos to the post yourself.",
      },
    ],
    photoNote: "Pick 5–10 of the best photos from the numbered zip.",
    notes: [
      "Read each group's rules first. Many need admin approval or limit rental posts to certain days.",
      "Post to groups you're already a member of, and don't paste the same text into dozens of groups.",
    ],
  };
}

export function zillowKit(f: ListingFacts): ChannelKit {
  return {
    id: "zillow",
    name: "Zillow Rental Manager",
    tagline: "Free for individual landlords. Also lists on Trulia and HotPads.",
    openUrl: "https://www.zillow.com/rental-manager/",
    openLabel: "Open Rental Manager",
    fields: [
      { label: "Property type", value: zillowType(f) },
      { label: "Street address", value: f.address.line1 },
      {
        label: "Unit or apt",
        value: f.address.line2 ?? "",
        hint: "Leave blank for a whole house.",
      },
      { label: "City", value: f.address.city },
      { label: "State", value: f.address.state },
      { label: "ZIP code", value: f.address.zip },
      { label: "Monthly rent", value: money(f.rentCents) },
      { label: "Security deposit", value: money(f.depositCents) },
      { label: "Bedrooms", value: n(f.bedrooms) },
      { label: "Bathrooms", value: n(f.bathrooms) },
      { label: "Square feet", value: n(f.squareFeet) },
      { label: "Date available", value: dateText(f.dateAvailable) },
      { label: "Lease length", value: f.leaseTerm ?? "" },
      { label: "Pets", value: f.pets.text ?? "" },
      { label: "Laundry", value: f.laundryText ?? "" },
      { label: "Parking", value: f.parking ?? "" },
      { label: "Heating", value: f.heat ?? "" },
      { label: "Cooling", value: f.cooling ?? "" },
      { label: "Appliances", value: list(f.appliances) },
      {
        label: "Other amenities",
        value: list([...f.amenities, ...(f.evCharging ? ["EV charging"] : [])]),
      },
      { label: "Utilities", value: f.utilitiesText ?? "" },
      description(f),
      { label: "Contact email", value: f.contactEmail ?? "" },
      { label: "Contact phone", value: f.contactPhone ?? "" },
    ],
    photoNote:
      "Upload the numbered zip in order; add the floor plan too if it asks for one.",
    notes: [
      "This follows Rental Manager's form as commonly described, in the order you'll meet it; the exact names and steps on screen may differ.",
    ],
  };
}

export function zumperKit(f: ListingFacts): ChannelKit {
  return {
    id: "zumper",
    name: "Zumper",
    tagline:
      "Free for owners with fewer than 10 properties. Also appears on PadMapper and WalkScore.",
    openUrl: "https://www.zumper.com/",
    openLabel: "Open Zumper",
    fields: [
      { label: "Address", value: fullAddress(f) },
      { label: "Monthly rent", value: money(f.rentCents) },
      { label: "Bedrooms", value: n(f.bedrooms) },
      { label: "Bathrooms", value: n(f.bathrooms) },
      { label: "Square feet", value: n(f.squareFeet) },
      { label: "Date available", value: dateText(f.dateAvailable) },
      { label: "Lease length", value: f.leaseTerm ?? "" },
      { label: "Security deposit", value: money(f.depositCents) },
      { label: "Pets", value: f.pets.text ?? "" },
      { label: "Parking", value: f.parking ?? "" },
      { label: "Laundry", value: f.laundryText ?? "" },
      { label: "Amenities", value: list([...f.appliances, ...f.amenities]) },
      description(f),
    ],
    photoNote: "Upload the numbered zip in order.",
    notes: [
      "Listings expire after 45 days and need renewing.",
      "Zumper may also show your listing on Facebook Marketplace, so don't post there as well.",
    ],
  };
}

// Suggested posting order: the broadest free reach first.
export function buildKits(f: ListingFacts): ChannelKit[] {
  return [
    zillowKit(f),
    craigslistKit(f),
    facebookKit(f),
    zumperKit(f),
    facebookGroupKit(f),
  ];
}

// For a "copy everything" button.
export function kitAsText(kit: ChannelKit): string {
  return kit.fields
    .filter((x) => x.value)
    .map((x) => (x.multiline ? `${x.label}:\n${x.value}` : `${x.label}: ${x.value}`))
    .join("\n\n");
}

export { bedBath };
