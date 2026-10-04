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
