// The questions the guided walk-through asks about an older house. This one
// catalog drives the landlord's forms, the server-side validation (schema.ts)
// and the public listing (format.ts), so they can never drift apart.
//
// Rules baked in:
//  - every field is optional;
//  - where a landlord might not know, the answer is Yes / No / Not sure, and
//    "Not sure" is never shown publicly (it is an open item for the landlord).
export type Option = { value: string; label: string };

type Base = {
  key: string;
  label: string;
  help?: string;
  // Sub-heading inside a section, shown above the first field of the group.
  group?: string;
};
export type Field =
  | (Base & { type: "select"; options: Option[] })
  | (Base & { type: "tri" })
  | (Base & { type: "tags"; options: Option[]; allowCustom?: boolean })
  | (Base & { type: "text"; max?: number; multiline?: boolean; placeholder?: string })
  | (Base & { type: "number"; min: number; max: number; unit?: string });

export const SECTION_KEYS = [
  "kitchen",
  "bathrooms",
  "basement",
  "laundry",
  "systems",
  "character",
  "knownConditions",
  "outdoors",
] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export type Section = {
  key: SectionKey;
  title: string;
  intro: string;
  // Repeatable sections (bathrooms) store an array of entries.
  repeatable?: boolean;
  fields: Field[];
};

export const UNSURE = "unsure";
const o = (value: string, label: string): Option => ({ value, label });
const opts = (...pairs: [string, string][]) => pairs.map(([v, l]) => o(v, l));
const unsure = o(UNSURE, "Not sure");

export const LEVELS = ["Basement", "First floor", "Second floor", "Third floor", "Attic"];

export const PROPERTY_STYLES: Option[] = opts(
  ["rowhouse", "Rowhouse"],
  ["semi-detached", "Semi-detached"],
  ["detached", "Detached house"],
  ["victorian", "Victorian"],
  ["farmhouse", "Farmhouse"],
  ["carriage-house", "Carriage house"],
  ["converted", "Converted church, school or warehouse"],
  ["other", "Other"],
);

export const ROOM_TYPES: Option[] = opts(
  ["bedroom", "Bedroom"],
  ["non-conforming-bedroom", "Non-conforming bedroom"],
  ["bath", "Bathroom"],
  ["kitchen", "Kitchen"],
  ["living", "Living room"],
  ["dining", "Dining room"],
  ["attic", "Attic"],
  ["basement", "Basement"],
  ["porch", "Porch"],
  ["yard", "Yard"],
  ["garage", "Garage"],
  ["outbuilding", "Outbuilding"],
  ["other", "Other"],
);

export const ROOM_TAGS: Option[] = opts(
  ["closet", "Closet"],
  ["built-ins", "Built-ins"],
  ["fireplace", "Fireplace"],
  ["pocket-doors", "Pocket doors"],
  ["transom", "Transom"],
  ["bay-window", "Bay window"],
  ["window-seat", "Window seat"],
  ["exposed-brick", "Exposed brick"],
  ["exposed-beams", "Exposed beams"],
);

export const SECTIONS: Section[] = [
  {
    key: "kitchen",
    title: "Kitchen",
    intro: "What a renter needs to know before moving their own appliances in.",
    fields: [
      {
        key: "layout",
        label: "Layout",
        type: "select",
        options: opts(
          ["galley", "Galley"],
          ["eat-in", "Eat-in"],
          ["open", "Open to the dining room"],
          ["separate", "Separate room"],
        ),
      },
      {
        key: "size",
        label: "Approximate size",
        type: "text",
        max: 60,
        placeholder: "About 11 × 14 ft",
      },
      { key: "pantry", label: "Pantry or butler's pantry", type: "tri" },
      {
        key: "cabinets",
        label: "Cabinets",
        type: "select",
        options: opts(
          ["original", "Original"],
          ["updated", "Updated"],
          ["mixed", "A mix of both"],
        ),
      },
      {
        key: "counters",
        label: "Countertops",
        type: "select",
        options: opts(
          ["laminate", "Laminate"],
          ["butcher-block", "Butcher block"],
          ["stone", "Stone"],
          ["tile", "Tile"],
          ["stainless", "Stainless steel"],
          ["other", "Other"],
        ),
      },
      {
        key: "floor",
        label: "Floor",
        type: "select",
        options: opts(
          ["original-wood", "Original wood"],
          ["vinyl", "Vinyl or linoleum"],
          ["tile", "Tile"],
          ["other", "Other"],
        ),
      },
      {
        key: "range",
        label: "Range",
        type: "select",
        group: "Appliances and hookups",
        options: opts(
          ["gas", "Gas"],
          ["electric", "Electric"],
          ["none", "None — bring your own"],
        ),
      },
      {
        key: "rangeHookups",
        label: "Hookups for your own range",
        type: "tags",
        options: opts(["gas-line", "Gas line"], ["240v", "240 V outlet"]),
      },
      {
        key: "fridgeSpace",
        label: "Space for a refrigerator",
        type: "text",
        max: 80,
        placeholder: "Width × depth × height, or “standard”",
        help: "Older kitchens often have a smaller opening than a modern fridge.",
      },
      {
        key: "dishwasher",
        label: "Dishwasher",
        type: "select",
        options: opts(["yes", "Yes"], ["no", "No"], ["hookup", "Hookup only"]),
      },
      { key: "disposal", label: "Garbage disposal", type: "tri" },
      { key: "microwave", label: "Microwave", type: "tri" },
      {
        key: "hood",
        label: "Range hood",
        type: "select",
        options: opts(
          ["vented", "Vented outside"],
          ["recirculating", "Recirculating"],
          ["none", "None"],
        ),
      },
      {
        key: "outlets",
        label: "Counter outlets",
        type: "select",
        group: "Power and light",
        options: opts(["few", "A few"], ["adequate", "Enough"], ["plenty", "Plenty"]),
      },
      { key: "gfci", label: "Outlets near the sink are GFCI-protected", type: "tri" },
      {
        key: "notes",
        label: "Quirks",
        type: "text",
        multiline: true,
        max: 600,
        placeholder: "Sloping floor, sticking drawers, undersized fridge space…",
      },
    ],
  },
  {
    key: "bathrooms",
    title: "Bathrooms",
    intro: "One entry per bathroom, including half baths.",
    repeatable: true,
    fields: [
      {
        key: "level",
        label: "Floor",
        type: "select",
        options: LEVELS.map((l) => o(l, l)),
      },
      {
        key: "type",
        label: "Type",
        type: "select",
        options: opts(
          ["full", "Full"],
          ["three-quarter", "Three-quarter"],
          ["half", "Half"],
        ),
      },
      {
        key: "tub",
        label: "Tub",
        type: "select",
        options: opts(
          ["clawfoot", "Claw-foot"],
          ["soaking", "Soaking"],
          ["alcove", "Alcove"],
          ["none", "None"],
        ),
      },
      {
        key: "shower",
        label: "Shower",
        type: "select",
        options: opts(
          ["over-tub", "Over the tub (curtain)"],
          ["stall", "Separate stall"],
          ["none", "None"],
        ),
      },
      {
        key: "fixtures",
        label: "Fixtures and finishes",
        type: "tags",
        allowCustom: true,
        options: opts(
          ["pedestal-sink", "Pedestal sink"],
          ["original-tile", "Original tile"],
          ["vanity", "Vanity"],
          ["high-tank", "High-tank toilet"],
          ["updated", "Updated fixtures"],
        ),
      },
      {
        key: "ventilation",
        label: "Ventilation",
        type: "select",
        options: opts(
          ["fan", "Exhaust fan"],
          ["window", "Window only"],
          ["neither", "Neither"],
        ),
      },
      {
        key: "outlet",
        label: "Outlets",
        type: "select",
        help: "Older bathrooms often have none — worth stating.",
        options: opts(["none", "None"], ["one", "One (GFCI)"], ["several", "Several"]),
      },
      {
        key: "hotWater",
        label: "Hot water",
        type: "text",
        max: 120,
        placeholder: "Takes about a minute to arrive",
      },
      {
        key: "access",
        label: "Access",
        type: "text",
        max: 120,
        placeholder: "Steps to reach it, tub wall height",
      },
      {
        key: "updatedYear",
        label: "Last updated",
        type: "number",
        min: 1850,
        max: 2100,
        unit: "year",
      },
      {
        key: "notes",
        label: "Quirks",
        type: "text",
        multiline: true,
        max: 400,
        placeholder: "Sloped ceiling, tight clearance, pressure…",
      },
    ],
  },
  {
    key: "basement",
    title: "Basement",
    intro:
      "In an old house the basement is a big part of the story — and the part renters ask about most.",
    fields: [
      {
        key: "type",
        label: "Type",
        type: "select",
        options: opts(
          ["full", "Full"],
          ["partial", "Partial"],
          ["crawlspace", "Crawlspace"],
          ["none", "None"],
        ),
      },
      {
        key: "finish",
        label: "Finish",
        type: "select",
        options: opts(
          ["unfinished", "Unfinished"],
          ["partial", "Partly finished"],
          ["finished", "Finished"],
        ),
      },
      {
        key: "headClearance",
        label: "Head clearance",
        type: "text",
        max: 80,
        placeholder: "About 7 ft, with low spots near the front",
      },
      {
        key: "floor",
        label: "Floor",
        type: "select",
        options: opts(
          ["concrete", "Concrete"],
          ["stone", "Stone"],
          ["brick", "Brick"],
          ["dirt", "Dirt"],
          ["other", "Other"],
        ),
      },
      {
        key: "walls",
        label: "Walls",
        type: "select",
        options: opts(
          ["stone", "Stone"],
          ["brick", "Brick"],
          ["block", "Block"],
          ["poured", "Poured concrete"],
          ["other", "Other"],
        ),
      },
      {
        key: "moisture",
        label: "Moisture",
        type: "select",
        group: "Water",
        options: opts(
          ["dry", "Dry"],
          ["damp", "Occasionally damp"],
          ["water-history", "Has had water"],
        ),
      },
      {
        key: "moistureYear",
        label: "Year water last came in",
        type: "number",
        min: 1850,
        max: 2100,
        unit: "year",
      },
      { key: "sumpPump", label: "Sump pump", type: "tri" },
      { key: "drain", label: "French drain", type: "tri" },
      { key: "dehumidifier", label: "Dehumidifier included", type: "tri" },
      { key: "floorDrain", label: "Floor drain", type: "tri" },
      {
        key: "access",
        label: "Access",
        type: "tags",
        group: "Getting in and using it",
        options: opts(
          ["interior-stairs", "Interior stairs"],
          ["bulkhead", "Exterior bulkhead"],
        ),
      },
      {
        key: "stairs",
        label: "Stairs",
        type: "select",
        options: opts(["standard", "Standard"], ["steep", "Steep"]),
      },
      {
        key: "lighting",
        label: "Lighting",
        type: "select",
        options: opts(["good", "Good"], ["limited", "Limited"]),
      },
      {
        key: "tenantUse",
        label: "Available to you for",
        type: "tags",
        options: opts(
          ["exclusive-storage", "Storage (yours alone)"],
          ["shared-storage", "Shared storage"],
          ["workshop", "Workshop"],
          ["laundry", "Laundry"],
        ),
      },
      {
        key: "mechanicals",
        label: "Mechanicals located here",
        type: "tags",
        options: opts(
          ["furnace", "Furnace or boiler"],
          ["water-heater", "Water heater"],
          ["panel", "Electrical panel"],
          ["meters", "Meters"],
        ),
      },
      { key: "radonTested", label: "Tested for radon", type: "tri", group: "Optional" },
      {
        key: "radonResult",
        label: "Radon result and date",
        type: "text",
        max: 120,
        help: "Only if a test exists. Your attorney can advise on wording.",
      },
      {
        key: "notes",
        label: "Quirks",
        type: "text",
        multiline: true,
        max: 600,
        placeholder: "Stone foundation, old coal chute, low beam…",
      },
    ],
  },
  {
    key: "laundry",
    title: "Laundry",
    intro: "Where it lives varies a lot in old houses.",
    fields: [
      {
        key: "location",
        label: "Location",
        type: "select",
        options: opts(
          ["basement", "Basement"],
          ["kitchen", "Kitchen"],
          ["bathroom", "Bathroom"],
          ["closet", "Closet"],
          ["none", "No laundry hookups"],
        ),
      },
      { key: "washerHookup", label: "Washer hookup", type: "tri" },
      {
        key: "dryer",
        label: "Dryer hookup",
        type: "select",
        options: opts(
          ["gas", "Gas"],
          ["electric", "Electric"],
          ["vent-only", "Vent only"],
          ["none", "None"],
        ),
      },
      { key: "laundrySink", label: "Laundry sink", type: "tri" },
      { key: "notes", label: "Notes", type: "text", multiline: true, max: 400 },
    ],
  },
  {
    key: "systems",
    title: "Systems",
    intro: "The older-house specifics: how it's heated, wired and plumbed.",
    fields: [
      {
        key: "heat",
        label: "Heat",
        type: "select",
        group: "Heat and cooling",
        options: opts(
          ["forced-air", "Forced air"],
          ["steam", "Steam radiators"],
          ["hot-water", "Hot-water radiators"],
          ["baseboard", "Baseboard"],
          ["none", "No central heat"],
          ["other", "Other"],
        ),
      },
      {
        key: "heatFuel",
        label: "Heating fuel",
        type: "select",
        options: [
          ...opts(
            ["gas", "Gas"],
            ["oil", "Oil"],
            ["electric", "Electric"],
            ["other", "Other"],
          ),
          unsure,
        ],
      },
      { key: "zones", label: "Thermostat zones", type: "text", max: 80 },
      { key: "radiatorCovers", label: "Radiator covers", type: "tri" },
      {
        key: "cooling",
        label: "Cooling",
        type: "select",
        options: opts(
          ["central", "Central air"],
          ["window-units", "Window units are fine"],
          ["mini-split", "Mini-split"],
          ["none", "None"],
        ),
      },
      { key: "windowsSuitAC", label: "Windows suit an air conditioner", type: "tri" },
      {
        key: "electricService",
        label: "Electrical service",
        type: "select",
        group: "Electrical",
        options: [...opts(["fuse", "Fuse box"], ["breakers", "Breaker panel"]), unsure],
      },
      {
        key: "electricAmps",
        label: "Amperage",
        type: "select",
        options: [
          ...opts(
            ["60", "60 amp"],
            ["100", "100 amp"],
            ["150", "150 amp"],
            ["200", "200 amp"],
          ),
          unsure,
        ],
      },
      {
        key: "grounded",
        label: "Grounded three-prong outlets",
        type: "select",
        options: [
          ...opts(["all", "Throughout"], ["some", "Some rooms"], ["none", "None"]),
          unsure,
        ],
      },
      {
        key: "wiring",
        label: "Wiring",
        type: "select",
        options: [
          ...opts(
            ["modern", "Modern"],
            ["mixed", "A mix"],
            ["knob-and-tube", "Some knob-and-tube remains"],
          ),
          unsure,
        ],
      },
      {
        key: "supplyPipes",
        label: "Water supply pipes",
        type: "select",
        group: "Plumbing",
        options: [
          ...opts(
            ["copper", "Copper"],
            ["galvanized", "Galvanized"],
            ["pex", "PEX"],
            ["mixed", "A mix"],
          ),
          unsure,
        ],
      },
      {
        key: "serviceLine",
        label: "Water service line (street to house)",
        type: "select",
        options: [...opts(["lead", "Lead"], ["copper", "Copper"]), unsure],
      },
      {
        key: "heaterType",
        label: "Water heater",
        type: "select",
        options: [
          ...opts(
            ["tank-gas", "Gas tank"],
            ["tank-electric", "Electric tank"],
            ["tankless", "Tankless"],
          ),
          unsure,
        ],
      },
      {
        key: "heaterSize",
        label: "Water heater size",
        type: "text",
        max: 40,
        placeholder: "40 gallons",
      },
      {
        key: "heaterAge",
        label: "Water heater age",
        type: "text",
        max: 40,
        placeholder: "About 5 years",
      },
      {
        key: "sewer",
        label: "Sewer line",
        type: "select",
        options: [...opts(["clay", "Original clay"], ["updated", "Updated"]), unsure],
      },
      {
        key: "windows",
        label: "Windows",
        type: "tags",
        group: "Windows and drafts",
        options: opts(
          ["original-wood", "Original wood sash"],
          ["replaced", "Replaced"],
          ["storms", "Storm windows"],
          ["screens", "Screens"],
        ),
      },
      { key: "windowsOpen", label: "Windows open easily", type: "tri" },
      { key: "atticInsulated", label: "Attic is insulated", type: "tri" },
      { key: "drafts", label: "Drafts", type: "text", max: 200 },
      {
        key: "utilityRange",
        label: "Typical monthly utilities",
        type: "text",
        max: 120,
        placeholder: "Gas about $90 in winter, electric about $60",
        help: "Only if you know it — it's the number renters of old houses most want.",
      },
      { key: "notes", label: "Notes", type: "text", multiline: true, max: 600 },
    ],
  },
  {
    key: "character",
    title: "Character and quirks",
    intro: "What makes this house itself — the features, and the things to know.",
    fields: [
      {
        key: "features",
        label: "Features",
        type: "tags",
        allowCustom: true,
        options: opts(
          ["hardwood", "Original hardwood or pine floors"],
          ["plaster", "Plaster walls"],
          ["picture-rails", "Picture rails"],
          ["crown", "Crown molding"],
          ["wainscoting", "Wainscoting"],
          ["tin-ceilings", "Tin ceilings"],
          ["medallions", "Ceiling medallions"],
          ["built-ins", "Built-ins and bookcases"],
          ["window-seat", "Window seat"],
          ["pocket-doors", "Pocket doors"],
          ["transoms", "Transoms"],
          ["stained-glass", "Stained or leaded glass"],
          ["banister", "Original banister"],
          ["back-stairs", "Back or servant stairs"],
          ["butlers-pantry", "Butler's pantry"],
          ["sleeping-porch", "Sleeping porch"],
          ["dumbwaiter", "Dumbwaiter"],
          ["coal-chute", "Coal chute"],
          ["cupola", "Cupola"],
        ),
      },
      {
        key: "fireplace",
        label: "Fireplace",
        type: "select",
        options: opts(
          ["working", "Working, wood-burning"],
          ["gas-log", "Gas log"],
          ["decorative", "Decorative only"],
          ["sealed", "Sealed"],
          ["none", "None"],
        ),
      },
      { key: "chimneyInspected", label: "Chimney inspected", type: "tri" },
      { key: "partyWall", label: "Shares a wall with the neighbor", type: "tri" },
      {
        key: "quirks",
        label: "Quirks",
        type: "tags",
        allowCustom: true,
        options: opts(
          ["steep-stairs", "Steep or narrow stairs"],
          ["low-doorways", "Low doorways or beams"],
          ["uneven-floors", "Uneven floors"],
          ["sloped-ceilings", "Sloped ceilings"],
          ["sticking", "Sticking windows or doors"],
          ["radiator-noise", "Banging radiator pipes"],
          ["hanging-pictures", "Hanging pictures takes care"],
        ),
      },
      {
        key: "moveIn",
        label: "Moving furniture in",
        type: "text",
        multiline: true,
        max: 400,
        placeholder: "Narrowest doorway, stair width, tight turns…",
        help: "Rarely stated, and very practical.",
      },
      { key: "notes", label: "Anything else", type: "text", multiline: true, max: 800 },
    ],
  },
  {
    key: "knownConditions",
    title: "Good to know",
    intro:
      "Optional. Anything you know that a tenant would want to know before signing. Your attorney should review the wording. The lead-paint notice is added automatically.",
    fields: [
      {
        key: "items",
        label: "Known conditions",
        type: "tags",
        allowCustom: true,
        options: opts(
          ["asbestos", "Asbestos floor tile or pipe wrap"],
          ["water", "Past water intrusion"],
          ["mold", "Past mold"],
          ["lead-line", "Lead water line"],
          ["knob-and-tube", "Knob-and-tube wiring"],
        ),
      },
      { key: "notes", label: "Details", type: "text", multiline: true, max: 800 },
    ],
  },
  {
    key: "outdoors",
    title: "Outdoors and parking",
    intro: "The space around the house.",
    fields: [
      { key: "porch", label: "Porch", type: "tri" },
      { key: "deck", label: "Deck or patio", type: "tri" },
      {
        key: "yard",
        label: "Yard",
        type: "select",
        options: opts(
          ["none", "No yard"],
          ["small", "Small"],
          ["fenced", "Fenced"],
          ["shared", "Shared"],
        ),
      },
      { key: "alley", label: "Rear alley access", type: "tri" },
      { key: "permitZone", label: "Street parking needs a permit", type: "tri" },
      { key: "parking", label: "Parking", type: "text", max: 200 },
      { key: "trashDay", label: "Trash and recycling day", type: "text", max: 80 },
      { key: "notes", label: "Notes", type: "text", multiline: true, max: 400 },
    ],
  },
];

export const SECTION_BY_KEY = Object.fromEntries(
  SECTIONS.map((s) => [s.key, s]),
) as Record<SectionKey, Section>;

// The per-room form in the rooms editor (validated by roomSchema in schema.ts).
export const ROOM_FIELDS: Field[] = [
  { key: "name", label: "Room name", type: "text", max: 80, placeholder: "Attic suite" },
  { key: "type", label: "Type", type: "select", options: ROOM_TYPES },
  { key: "level", label: "Floor", type: "select", options: LEVELS.map((l) => o(l, l)) },
  {
    key: "marker",
    label: "Marker on your floor plan",
    type: "text",
    max: 3,
    placeholder: "A",
    help: "A letter or number you wrote on the sketch.",
  },
  { key: "lengthFt", label: "Length", type: "number", min: 1, max: 200, unit: "ft" },
  { key: "widthFt", label: "Width", type: "number", min: 1, max: 200, unit: "ft" },
  {
    key: "ceilingNote",
    label: "Ceiling height",
    type: "text",
    max: 120,
    placeholder: "About 9 ft, sloped on one side",
  },
  {
    key: "light",
    label: "Natural light",
    type: "text",
    max: 160,
    placeholder: "Two south windows",
  },
  { key: "tags", label: "Features", type: "tags", allowCustom: true, options: ROOM_TAGS },
  {
    key: "countsAsBedroom",
    label: "Counts as a bedroom",
    type: "tri",
    help: "A closet and an exit window are what usually make a room a legal bedroom.",
  },
  { key: "notes", label: "Notes", type: "text", multiline: true, max: 500 },
];
