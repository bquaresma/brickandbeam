// Fictional sample data for development, tests and dress rehearsals.
// The real property is NOT seeded — enter it through the app's own forms.
//
// Run with `npm run db:seed` (also runs after `npm run db:reset`). Safe to run
// repeatedly: it only creates the sample landlord and property if missing.
// Runs directly under Node's built-in TypeScript support (no extra tooling).
import { PrismaClient } from "@prisma/client";

import { hashPassword } from "../src/lib/password.ts";

const prisma = new PrismaClient();

const SAMPLE_EMAIL = "sample.landlord@example.com";
const SAMPLE_PASSWORD = "sample-password-123";

async function main() {
  const landlord = await prisma.user.upsert({
    where: { email: SAMPLE_EMAIL },
    update: {},
    create: {
      email: SAMPLE_EMAIL,
      name: "Sample Landlord",
      passwordHash: await hashPassword(SAMPLE_PASSWORD),
      role: "LANDLORD",
    },
  });

  const existing = await prisma.property.findFirst({
    where: { landlordId: landlord.id, name: "Sample rowhouse" },
  });
  if (existing) {
    console.log("Sample data already present — nothing to do.");
    return;
  }

  await prisma.property.create({
    data: {
      landlordId: landlord.id,
      name: "Sample rowhouse",
      addressLine1: "100 Example Street",
      city: "Pittsburgh",
      state: "PA",
      zip: "15201",
      buildYear: 1910,
      isWholeHouse: true,
      publicContactEmail: "leasing@example.com",
      neighborhoodBlurb: "A sample blurb about a walkable, tree-lined block.",
      units: {
        create: {
          name: "Whole house",
          rentAmountCents: 185000,
          bedrooms: 3,
          bathrooms: 1.5,
          squareFeet: 1400,
          layoutNotes: "Sample layout notes: converted attic is a bonus room.",
          rooms: [
            {
              id: "r1",
              name: "Kitchen",
              type: "kitchen",
              level: "First floor",
              marker: "A",
              lengthFt: 11,
              widthFt: 14,
              ceilingNote: "About 9 ft",
              light: "Two south windows",
              tags: ["built-ins"],
            },
            {
              id: "r2",
              name: "Front parlor",
              type: "living",
              level: "First floor",
              marker: "B",
              lengthFt: 13,
              widthFt: 15,
              tags: ["fireplace", "pocket-doors"],
            },
            {
              id: "r3",
              name: "Attic suite",
              type: "non-conforming-bedroom",
              level: "Attic",
              marker: "C",
              lengthFt: 11,
              widthFt: 14,
              countsAsBedroom: "no",
              roomHeat: "radiator",
              notes: "Sloped ceilings; no closet, but a built-in wardrobe.",
            },
          ],
          details: {
            version: 1,
            kitchen: {
              layout: "eat-in",
              range: "gas",
              rangeHookups: ["gas-line", "240v"],
              fridgeSpace: "30 in wide - standard",
              dishwasher: "hookup",
              gfci: "unsure",
              notes: "The floor slopes gently toward the back window.",
            },
            bathrooms: [
              {
                id: "b1",
                name: "Upstairs bath",
                level: "Second floor",
                type: "full",
                tub: "clawfoot",
                shower: "over-tub",
                ventilation: "window",
                outlet: "none",
                fixtures: ["pedestal-sink", "original-tile"],
                notes: "Sloped ceiling over the tub.",
              },
              { id: "b2", level: "First floor", type: "half" },
            ],
            basement: {
              type: "full",
              finish: "unfinished",
              headClearance: "About 7 ft, with a low beam near the stairs",
              floor: "concrete",
              walls: "stone",
              moisture: "damp",
              sumpPump: "yes",
              access: ["interior-stairs", "bulkhead"],
              mechanicals: ["furnace", "water-heater", "panel"],
              tenantUse: ["exclusive-storage", "laundry"],
            },
            laundry: { location: "basement", washerHookup: "yes", dryer: "gas" },
            systems: {
              heat: "steam",
              heatFuel: "gas",
              cooling: "window-units",
              electricService: "breakers",
              electricAmps: "100",
              grounded: "unsure",
              windows: ["original-wood", "storms"],
              utilityRange: "Gas about $90 in winter",
            },
            energy: { evCharging: "outlet-240", solar: "none", smartThermostat: "yes" },
            tech: {
              internet: ["fiber", "cable"],
              lockType: "smart",
              doorbell: "camera",
              cameras: "exterior",
              detectors: "both",
            },
            upkeep: {
              snow: "tenant",
              yardCare: "tenant",
              pestHistory: "none",
              roofAge: "Replaced about 2018",
            },
            character: {
              features: ["hardwood", "plaster", "pocket-doors", "built-ins"],
              fireplace: "decorative",
              partyWall: "yes",
              quirks: ["steep-stairs", "radiator-noise"],
              moveIn: "Narrowest turn is the back stairs, about 28 in.",
            },
            knownConditions: {
              items: ["water"],
              notes:
                "Water came in once, in 2019, after a storm; the sump pump was added afterward.",
            },
            outdoors: { porch: "yes", yard: "small", permitZone: "yes" },
            facts: [{ id: "f1", label: "Nearby", value: "Two blocks from the bus line" }],
          },
          parkingType: "STREET",
          amenities: {
            create: [
              { label: "Original hardwood floors" },
              { label: "Dishwasher", category: "APPLIANCE" },
            ],
          },
          utilities: {
            create: [
              { type: "WATER", included: true },
              { type: "ELECTRIC", included: false },
            ],
          },
          petPolicies: { create: [{ petType: "CATS", allowed: true }] },
          fees: {
            create: [
              {
                type: "SECURITY_DEPOSIT",
                amountCents: 185000,
                timing: "MOVE_IN",
                refundable: "REFUNDABLE",
              },
            ],
          },
          listing: {
            create: {
              headline: "Sample rowhouse with a story",
              previewMessage: "A sample listing used for development and tests.",
              story: "This is sample copy.\nIt exists so the app has something to show.",
              leaseTerm: "12 months",
              status: "PUBLISHED",
              publishedAt: new Date(),
              leads: {
                create: [
                  {
                    name: "Sample Prospect",
                    email: "prospect@example.com",
                    message: "Is it available in March?",
                  },
                ],
              },
            },
          },
        },
      },
    },
  });

  console.log(`Seeded sample data. Sign in as ${SAMPLE_EMAIL} / ${SAMPLE_PASSWORD}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
