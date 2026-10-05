import { describe, expect, it } from "vitest";

import {
  adTitle,
  dateText,
  describe as describeHouse,
  footer,
  leadNotice,
} from "./compose";
import { buildFacts, type FactsInput } from "./facts";
import { checkCopy } from "./fairhousing";
import { buildKits, kitAsText } from "./kits";
import { zipEntries, type KitPhoto } from "./photos";

const base = (over: Partial<FactsInput> = {}, buildYear = 1900): FactsInput => ({
  property: {
    addressLine1: "100 Example Street",
    addressLine2: null,
    city: "Pittsburgh",
    state: "PA",
    zip: "15201",
    buildYear,
    propertyStyle: "rowhouse",
    neighborhoodBlurb: "A walkable, tree-lined block.",
    publicContactEmail: "leasing@example.com",
    publicContactPhone: "412-555-0100",
  },
  unit: {
    name: "Whole house",
    rentAmountCents: 185000,
    bedrooms: 3,
    bathrooms: 1.5,
    squareFeet: 1400,
    dateAvailable: new Date("2027-03-01T00:00:00Z"),
    isFurnished: false,
    smokingAllowed: false,
    parkingType: "STREET",
    details: {
      version: 1,
      laundry: { location: "basement", washerHookup: "yes", dryer: "gas" },
      systems: { heat: "steam", heatFuel: "gas", cooling: "window-units" },
      energy: { evCharging: "outlet-240" },
      character: { features: ["hardwood", "pocket-doors"], quirks: ["steep-stairs"] },
      bathrooms: [{ id: "a", tub: "clawfoot" }],
    },
  },
  listing: {
    headline: "Rowhouse with a story",
    previewMessage: "A 1900 rowhouse with its original floors.",
    story: "First paragraph.\n\nSecond paragraph.",
    leaseTerm: "12 months",
  },
  amenities: [
    { label: "Dishwasher", category: "APPLIANCE" },
    { label: "Original hardwood floors", category: "AMENITY" },
  ],
  petPolicies: [
    { petType: "CATS", petSize: null, allowed: true },
    { petType: "DOGS", petSize: null, allowed: false },
  ],
  fees: [{ type: "SECURITY_DEPOSIT", amountCents: 185000 }],
  utilities: [
    { type: "WATER", included: true },
    { type: "ELECTRIC", included: false },
    { type: "GAS", included: false },
  ],
  ...over,
});

const facts = (over: Partial<FactsInput> = {}, year = 1900) =>
  buildFacts(base(over, year));

describe("buildFacts", () => {
  it("turns the stored answers into the words the sites use", () => {
    const f = facts();
    expect(f).toMatchObject({
      styleLabel: "rowhouse",
      laundry: "W/D hookups",
      heat: "Steam radiators (gas)",
      cooling: "Window air conditioners",
      hasAirConditioning: true,
      evCharging: true,
      parking: "Street parking",
      depositCents: 185000,
    });
    expect(f.laundryText).toBe("Washer hookup and gas dryer hookup, in the basement");
    expect(f.pets.text).toBe("Cats allowed, no dogs");
    expect(f.utilitiesText).toBe("Water included; tenant sets up electric and gas");
    expect(f.story).toEqual(["First paragraph.", "Second paragraph."]);
    expect(f.highlights).toContain("Claw-foot tub");
  });

  it("copes with a listing that has almost nothing filled in", () => {
    const f = facts({
      unit: {
        ...base().unit,
        rentAmountCents: null,
        bedrooms: null,
        details: null,
        parkingType: null,
        dateAvailable: null,
      },
      petPolicies: [],
      utilities: [],
      fees: [],
      amenities: [],
    });
    expect(f.laundry).toBeNull();
    expect(f.heat).toBeNull();
    expect(f.pets.text).toBeNull();
    expect(f.utilitiesText).toBeNull();
    expect(f.evCharging).toBe(false);
  });
});

describe("shared ad text", () => {
  it("adds the lead-paint notice for a house built before 1978, and not otherwise", () => {
    expect(leadNotice(facts({}, 1900))).toMatch(
      /Built in 1900.*lead-based paint.*EPA pamphlet/,
    );
    expect(leadNotice(facts({}, 1978))).toBeNull();
    expect(footer(facts({}, 1990))).toBe("Equal Housing Opportunity.");
  });

  it("ends every footer with the equal housing line, and adds a permit number when one applies", () => {
    expect(footer(facts()).endsWith("Equal Housing Opportunity.")).toBe(true);
    const withPermit = footer({ ...facts(), permitNumber: "R-1234" });
    expect(withPermit).toContain("Rental permit no. R-1234.");
    expect(withPermit.endsWith("Equal Housing Opportunity.")).toBe(true);
  });

  it("formats the move-in date without slipping a day", () => {
    expect(dateText(new Date("2027-03-01T00:00:00Z"))).toBe("March 1, 2027");
    expect(dateText(null)).toBe("");
  });

  it("builds a title that fits, at a word boundary, with no dangling punctuation", () => {
    const title = adTitle(facts(), 70);
    expect(title.length).toBeLessThanOrEqual(70);
    expect(title).toBe(
      "3-bedroom rowhouse with original hardwood or pine floors, pocket doors",
    );
    const short = adTitle(facts(), 40);
    expect(short.length).toBeLessThanOrEqual(40);
    expect(short).not.toMatch(/[\s,;:–—-]…?$/);
    expect(short.endsWith("…")).toBe(true);
  });

  it("writes a plain-text description with the details, contact, and disclosures", () => {
    const text = describeHouse(facts(), "full");
    expect(text).toContain("The details");
    expect(text).toContain("- Rent: $1,850 per month");
    expect(text).toContain("- Available March 1, 2027, 12 months lease");
    expect(text).toContain("email leasing@example.com or call or text 412-555-0100");
    expect(text).toContain("Worth knowing: steep or narrow stairs.");
    expect(text).toContain("lead-based paint");
    expect(text.trimEnd().endsWith("Equal Housing Opportunity.")).toBe(true);
    // Plain text: no emoji or markup.
    expect(text).not.toMatch(/\p{Extended_Pictographic}|<[a-z]|\*\*/u);
  });

  it("makes a shorter version for groups that keeps the essentials", () => {
    const full = describeHouse(facts(), "full");
    const short = describeHouse(facts(), "short");
    expect(short.length).toBeLessThan(full.length);
    expect(short).toContain("$1,850");
    expect(short).toContain("lead-based paint");
    expect(short).toContain("Equal Housing Opportunity.");
  });
});

describe("channel kits", () => {
  const kits = buildKits(facts());
  const byId = Object.fromEntries(kits.map((k) => [k.id, k]));

  it("covers the launch channels, broadest free reach first", () => {
    expect(kits.map((k) => k.id)).toEqual([
      "zillow",
      "craigslist",
      "facebook",
      "zumper",
      "facebook-group",
    ]);
  });

  it("puts the lead-paint notice and the equal housing line in every ad", () => {
    for (const kit of kits) {
      const body = kit.fields.find((f) => f.multiline)!.value;
      expect(body, kit.name).toContain("lead-based paint");
      expect(body.trimEnd().endsWith("Equal Housing Opportunity."), kit.name).toBe(true);
    }
  });

  it("never prints 'undefined', 'null' or 'NaN'", () => {
    const bare = buildKits(
      facts({
        unit: {
          ...base().unit,
          rentAmountCents: null,
          bedrooms: null,
          bathrooms: null,
          squareFeet: null,
          dateAvailable: null,
          details: null,
          parkingType: null,
        },
        listing: {
          headline: null,
          previewMessage: null,
          story: "Just a story.",
          leaseTerm: null,
        },
        petPolicies: [],
        utilities: [],
        fees: [],
        amenities: [],
      }),
    );
    for (const kit of bare)
      expect(kitAsText(kit), kit.name).not.toMatch(/undefined|null|NaN/);
  });

  it("leaves fields empty, not made up, when there's nothing to say", () => {
    const f = buildKits(facts({ unit: { ...base().unit, rentAmountCents: null } }));
    expect(f[1].fields.find((x) => x.label === "Rent per month")!.value).toBe("");
  });

  it("fits Craigslist's conventions", () => {
    const cl = byId.craigslist;
    const get = (label: string) => cl.fields.find((f) => f.label === label)!.value;
    expect(get("Posting title").length).toBeLessThanOrEqual(70);
    expect(get("Rent per month")).toBe("1850");
    expect(get("Housing type")).toBe("townhouse");
    expect(get("Cats OK")).toBe("Yes");
    expect(get("Dogs OK")).toBe("No");
    expect(get("No smoking")).toBe("Yes");
    expect(get("EV charging")).toBe("Yes");
    expect(get("Laundry")).toBe("W/D hookups");
    expect(cl.photoNote).toContain("24");
  });

  it("maps a rowhouse to a Townhouse on Zillow, and carries the contact and deposit", () => {
    const get = (label: string) =>
      byId.zillow.fields.find((f) => f.label === label)!.value;
    expect(get("Property type")).toBe("Townhouse");
    expect(get("Security deposit")).toBe("$1,850");
    expect(get("Unit or apt")).toBe("");
    expect(get("Contact email")).toBe("leasing@example.com");
  });

  it("warns about Zumper's expiry and its Marketplace overlap", () => {
    expect(byId.zumper.notes.join(" ")).toMatch(/45 days/);
    expect(byId.zumper.notes.join(" ")).toMatch(/Marketplace/);
    expect(byId.facebook.notes.join(" ")).toMatch(/Zumper/);
  });

  it("includes a rental permit number once one applies", () => {
    const withPermit = buildKits({ ...facts(), permitNumber: "R-1234" });
    expect(
      withPermit.find((k) => k.id === "craigslist")!.fields.find((f) => f.multiline)!
        .value,
    ).toContain("R-1234");
  });
});

describe("checkCopy (Fair Housing, advisory)", () => {
  const flagged = (text: string) =>
    checkCopy([{ where: "Story", text }]).map((f) => f.id);

  it("flags language about who should or shouldn't live somewhere", () => {
    expect(flagged("No kids please.")).toContain("no-children");
    expect(flagged("Adults only building")).toContain("no-children");
    expect(flagged("Perfect for young professionals!")).toContain("who-for");
    expect(flagged("ideal for a couple")).toContain("who-for");
    expect(flagged("A family-friendly block")).toContain("family-friendly");
    expect(flagged("Mature adults preferred")).toContain("age");
    expect(flagged("Females only")).toContain("single-gender");
    expect(flagged("Not suitable for the handicapped")).toContain("disability");
    expect(flagged("English speaking tenants only")).toContain("national-origin");
    expect(flagged("Walking distance to church")).toContain("houses-of-worship");
    expect(flagged("Close to a synagogue")).toContain("houses-of-worship");
    expect(flagged("Christian household")).toContain("religion");
    expect(flagged("A safe neighborhood")).toContain("steering");
    expect(flagged("No Section 8")).toContain("income-source");
  });

  it("leaves ordinary descriptions of the home alone", () => {
    for (const text of [
      "A sunny family room with original hardwood floors.",
      "Walk-in closet, pocket doors, and a claw-foot tub.",
      "Two blocks from the bus line and a park.",
      "White walls and a wood-burning fireplace.",
      "Three steps to the front door; the bathroom is on the second floor.",
      "The master suite has a sloped ceiling.",
      "Close to shops and the river trail.",
    ]) {
      expect(flagged(text), text).toEqual([]);
    }
  });

  it("says where each phrase was found, once, and explains it", () => {
    const findings = checkCopy([
      { where: "Headline", text: "Great for singles" },
      { where: "Story", text: "Great for singles. Great for singles." },
      { where: "Preview", text: null },
    ]);
    expect(findings.map((f) => f.where)).toEqual(["Headline", "Story"]);
    expect(findings[0]).toMatchObject({
      phrase: "Great for singles",
      category: expect.any(String),
    });
    expect(findings[0].suggestion.length).toBeGreaterThan(10);
  });
});

describe("zipEntries", () => {
  const variants = (extra = true) => [
    {
      preset: "display" as const,
      width: 1600,
      height: 1000,
      format: "jpeg" as const,
      key: "k/display-1600.jpg",
      bytes: 1,
    },
    ...(extra
      ? [
          {
            preset: "export" as const,
            width: 2048,
            height: 1280,
            format: "jpeg" as const,
            key: "k/export-2048.jpg",
            bytes: 1,
          },
        ]
      : []),
  ];
  const photo = (over: Partial<KitPhoto>): KitPhoto => ({
    kind: "PHOTO",
    area: "OTHER",
    level: null,
    isHero: false,
    sortOrder: 0,
    variants: variants(),
    ...over,
  });

  it("numbers photos with the hero first, so the first N files are the first N a site shows", () => {
    const entries = zipEntries([
      photo({ area: "KITCHEN", sortOrder: 0 }),
      photo({ area: "EXTERIOR", sortOrder: 5, isHero: true }),
      photo({ area: "BATHROOM", sortOrder: 1 }),
    ]);
    expect(entries.map((e) => e.name)).toEqual([
      "01-exterior-hero.jpg",
      "02-kitchen.jpg",
      "03-bathroom.jpg",
    ]);
  });

  it("uses the 2048 px export, falling back to the largest JPEG, and skips photos with neither", () => {
    expect(zipEntries([photo({})])[0].key).toBe("k/export-2048.jpg");
    expect(zipEntries([photo({ variants: variants(false) })])[0].key).toBe(
      "k/display-1600.jpg",
    );
    expect(zipEntries([photo({ variants: [] })])).toEqual([]);
  });

  it("puts floor plans last, as lossless PNGs named by floor", () => {
    const plan = photo({
      kind: "FLOOR_PLAN",
      level: "First floor",
      variants: [
        {
          preset: "plan",
          width: 800,
          height: 600,
          format: "png",
          key: "p/plan-800.png",
          bytes: 1,
        },
        {
          preset: "plan",
          width: 2400,
          height: 1800,
          format: "png",
          key: "p/plan-2400.png",
          bytes: 1,
        },
        {
          preset: "plan",
          width: 2400,
          height: 1800,
          format: "webp",
          key: "p/plan-2400.webp",
          bytes: 1,
        },
      ],
    });
    const entries = zipEntries([plan, photo({ area: "LIVING" })]);
    expect(entries.map((e) => e.name)).toEqual([
      "01-living-spaces.jpg",
      "floor-plan-first-floor.png",
    ]);
    expect(entries[1].key).toBe("p/plan-2400.png");
  });
});
