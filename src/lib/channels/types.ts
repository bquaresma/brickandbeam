// One generated ad kit per posting site. Everything here is plain data so the
// formatters stay pure and unit-testable.
export type KitField = {
  label: string;
  // Empty means "not set yet" — the page says what to add instead of copying a blank.
  value: string;
  hint?: string;
  multiline?: boolean;
  // A soft length guide. The site shows its real limit; this only warns early.
  softLimit?: number;
};

export type ChannelId =
  "zillow" | "craigslist" | "facebook" | "facebook-group" | "zumper";

export type ChannelKit = {
  id: ChannelId;
  name: string;
  tagline: string;
  openUrl: string;
  openLabel: string;
  fields: KitField[];
  photoNote: string;
  notes: string[];
};

export type ListingFacts = {
  headline: string;
  preview: string | null;
  story: string[]; // paragraphs
  address: {
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    zip: string;
  };
  neighborhood: string | null;
  buildYear: number;
  styleLabel: string; // "rowhouse", "house", ...
  propertyStyle: string | null;
  unitName: string;
  rentCents: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: number | null;
  dateAvailable: Date | null;
  leaseTerm: string | null;
  furnished: boolean | null;
  smokingAllowed: boolean | null;
  parking: string | null;
  laundry: string | null; // CL-style: "W/D hookups", "No laundry", ...
  laundryText: string | null; // prose: "Washer hookup and gas dryer hookup, in the basement"
  heat: string | null;
  cooling: string | null;
  hasAirConditioning: boolean | null;
  evCharging: boolean;
  pets: { cats: boolean | null; dogs: boolean | null; text: string | null };
  utilitiesText: string | null;
  depositCents: number | null;
  applicationFeeCents: number | null;
  appliances: string[];
  amenities: string[];
  highlights: string[];
  quirks: string[];
  contactEmail: string | null;
  contactPhone: string | null;
  // Set when the compliance tracker says a rental permit applies and the
  // landlord marked it "include in ads" (Stage 1.6). Null until then.
  permitNumber: string | null;
};
