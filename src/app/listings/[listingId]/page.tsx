import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { requiresLeadPaintDisclosure } from "@/lib/compliance";

const PARKING_LABELS: Record<string, string> = {
  GARAGE_ATTACHED: "Attached garage",
  GARAGE_LOT: "Garage lot",
  COVERED_LOT: "Covered lot",
  STREET: "Street parking",
  SURFACE_LOT: "Surface lot",
  OTHER: "Parking available",
  NONE: "No parking",
};

const PET_TYPE_LABELS: Record<string, string> = {
  DOGS: "Dogs",
  CATS: "Cats",
  BIRDS: "Birds",
  REPTILES: "Reptiles",
  FISH: "Fish",
  OTHER: "Other pets",
};

const FEE_TYPE_LABELS: Record<string, string> = {
  SECURITY_DEPOSIT: "Security deposit",
  APPLICATION_FEE: "Application fee",
  PET_RENT: "Pet rent",
  PET_DEPOSIT: "Pet deposit",
  PET_FEE: "Pet fee",
  PARKING_FEE: "Parking fee",
  PARKING_PERMIT: "Parking permit",
  STORAGE_FEE: "Storage fee",
  SEWER_FEE: "Sewer fee",
  GARBAGE_FEE: "Garbage fee",
  OTHER: "Fee",
};

const FEE_TIMING_LABELS: Record<string, string> = {
  MOVE_IN: "at move-in",
  AT_APPLICATION: "at application",
  MONTHLY: "monthly",
  ONE_TIME_OTHER: "one-time",
  RECURRING_OTHER: "recurring",
};

const UTILITY_LABELS: Record<string, string> = {
  WATER: "Water",
  GAS: "Gas",
  ELECTRIC: "Electric",
  TRASH: "Trash",
  SEWER: "Sewer",
  INTERNET: "Internet",
  CABLE: "Cable",
  OTHER: "Other",
};

async function getListing(listingId: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      unit: {
        include: {
          property: {
            include: { landlord: { select: { name: true, email: true } } },
          },
          amenities: { orderBy: { createdAt: "asc" } },
          petPolicies: { orderBy: { createdAt: "asc" } },
          fees: { orderBy: { createdAt: "asc" } },
          utilities: true,
        },
      },
    },
  });

  if (!listing || listing.status !== "PUBLISHED") return null;
  return listing;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ listingId: string }>;
}): Promise<Metadata> {
  const { listingId } = await params;
  const listing = await getListing(listingId);
  if (!listing) return { title: "Listing not found" };

  return {
    title: listing.headline || listing.unit.name,
    description: listing.previewMessage || listing.story.slice(0, 160),
  };
}

export default async function PublicListingPage({
  params,
}: {
  params: Promise<{ listingId: string }>;
}) {
  const { listingId } = await params;
  const listing = await getListing(listingId);
  if (!listing) notFound();

  const { unit } = listing;
  const { property } = unit;
  const leadPaintGate = requiresLeadPaintDisclosure(property.buildYear);

  const appliances = unit.amenities.filter((a) => a.category === "APPLIANCE");
  const amenities = unit.amenities.filter((a) => a.category === "AMENITY");
  const includedUtilities = unit.utilities.filter((u) => u.included);
  const tenantUtilities = unit.utilities.filter((u) => !u.included);

  const storyParagraphs = listing.story.split("\n").filter((p) => p.trim());

  const mailSubject = encodeURIComponent(
    `Showing request: ${listing.headline || unit.name}`,
  );
  const mailBody = encodeURIComponent(
    `Hi, I'm interested in scheduling a showing for ${listing.headline || unit.name} at ${property.addressLine1}, ${property.city}, ${property.state}.`,
  );
  const mailtoHref = property.landlord.email
    ? `mailto:${property.landlord.email}?subject=${mailSubject}&body=${mailBody}`
    : null;

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-5">
          <span className="text-lg font-semibold text-stone-900">Brick and Beam</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {listing.heroPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.heroPhotoUrl}
            alt={listing.headline || unit.name}
            className="aspect-video w-full rounded-lg border border-stone-200 object-cover"
          />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed border-stone-300 bg-stone-100 text-sm text-stone-400">
            No photo yet
          </div>
        )}

        <div className="mt-6 text-xs font-semibold tracking-wide text-amber-800 uppercase">
          {property.city}, {property.state}
        </div>
        <h1 className="mt-2 text-3xl font-semibold text-stone-900">
          {listing.headline || unit.name}
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          {property.addressLine1}
          {property.addressLine2 ? `, ${property.addressLine2}` : ""}
          {unit.name !== (listing.headline || unit.name) ? ` — ${unit.name}` : ""}
        </p>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-baseline gap-3">
            {unit.rentAmountCents != null && (
              <span className="text-2xl font-semibold text-stone-900">
                ${(unit.rentAmountCents / 100).toLocaleString()}
                <span className="text-sm font-normal text-stone-500">/mo</span>
              </span>
            )}
            <span className="text-sm text-stone-500">
              {[
                listing.leaseTerm,
                unit.dateAvailable
                  ? `Available ${unit.dateAvailable.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </div>
          <div className="flex gap-2">
            {mailtoHref && (
              <a
                href={mailtoHref}
                className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
              >
                Request a Showing
              </a>
            )}
            {listing.virtualTourUrl && (
              <a
                href={listing.virtualTourUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Virtual Tour
              </a>
            )}
          </div>
        </div>

        <div className="mt-6 flex gap-8 border-y border-stone-200 py-4 text-sm">
          {unit.bedrooms != null && (
            <div>
              <div className="font-semibold text-stone-900">{unit.bedrooms}</div>
              <div className="text-stone-500">Bedrooms</div>
            </div>
          )}
          {unit.bathrooms != null && (
            <div>
              <div className="font-semibold text-stone-900">{unit.bathrooms}</div>
              <div className="text-stone-500">Bathrooms</div>
            </div>
          )}
          {unit.squareFeet != null && (
            <div>
              <div className="font-semibold text-stone-900">{unit.squareFeet}</div>
              <div className="text-stone-500">Square Feet</div>
            </div>
          )}
        </div>

        {storyParagraphs.length > 0 && (
          <section className="mt-10 max-w-2xl">
            <h2 className="text-xs font-semibold tracking-wide text-amber-800 uppercase">
              The Story
            </h2>
            {listing.previewMessage && (
              <p className="mt-3 text-lg leading-relaxed text-stone-800 italic">
                {listing.previewMessage}
              </p>
            )}
            <div className="mt-3 space-y-4 text-stone-700">
              {storyParagraphs.map((paragraph, i) => (
                <p key={i} className="leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        )}

        {listing.floorPlanUrl && (
          <section className="mt-10">
            <h2 className="text-xs font-semibold tracking-wide text-amber-800 uppercase">
              The Layout
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={listing.floorPlanUrl}
                alt="Floor plan"
                className="rounded-lg border border-stone-200"
              />
              {unit.layoutNotes && (
                <div>
                  <p className="text-sm font-medium text-stone-900">
                    Not your standard layout.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">
                    {unit.layoutNotes}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {(appliances.length > 0 || amenities.length > 0) && (
          <section className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2">
            {appliances.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold tracking-wide text-amber-800 uppercase">
                  Appliances Included
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {appliances.map((a) => (
                    <span
                      key={a.id}
                      className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-700"
                    >
                      {a.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {amenities.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold tracking-wide text-amber-800 uppercase">
                  Amenities
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {amenities.map((a) => (
                    <span
                      key={a.id}
                      className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-900"
                    >
                      {a.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <section className="mt-10 flex flex-wrap gap-6 rounded-md border border-stone-200 bg-white px-5 py-4 text-sm text-stone-700">
          {unit.parkingType && <span>{PARKING_LABELS[unit.parkingType]}</span>}
          {unit.isFurnished != null && (
            <span>{unit.isFurnished ? "Furnished" : "Unfurnished"}</span>
          )}
          {unit.smokingAllowed != null && (
            <span>{unit.smokingAllowed ? "Smoking allowed" : "No smoking"}</span>
          )}
        </section>

        {unit.petPolicies.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xs font-semibold tracking-wide text-amber-800 uppercase">
              Pet Policy
            </h2>
            <ul className="mt-3 space-y-1 text-sm text-stone-700">
              {unit.petPolicies.map((p) => (
                <li key={p.id}>
                  {PET_TYPE_LABELS[p.petType]}
                  {p.petSize
                    ? ` (${p.petSize === "SMALL" ? "small" : "large"})`
                    : ""}:{" "}
                  <span className={p.allowed ? "text-green-700" : "text-red-700"}>
                    {p.allowed ? "welcome" : "not allowed"}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {(includedUtilities.length > 0 || tenantUtilities.length > 0) && (
          <section className="mt-10">
            <h2 className="text-xs font-semibold tracking-wide text-amber-800 uppercase">
              What&apos;s Included
            </h2>
            <div className="mt-3 space-y-1 text-sm text-stone-700">
              {includedUtilities.length > 0 && (
                <div>
                  <span className="font-medium text-stone-900">Included in rent:</span>{" "}
                  {includedUtilities.map((u) => UTILITY_LABELS[u.type]).join(", ")}
                </div>
              )}
              {tenantUtilities.length > 0 && (
                <div>
                  <span className="font-medium text-stone-900">Tenant sets up:</span>{" "}
                  {tenantUtilities.map((u) => UTILITY_LABELS[u.type]).join(", ")}
                </div>
              )}
            </div>
          </section>
        )}

        {unit.fees.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xs font-semibold tracking-wide text-amber-800 uppercase">
              Costs &amp; Fees
            </h2>
            <ul className="mt-3 space-y-1 text-sm text-stone-700">
              {unit.fees.map((f) => (
                <li key={f.id}>
                  {FEE_TYPE_LABELS[f.type]}
                  {f.amountCents != null
                    ? ` — $${(f.amountCents / 100).toLocaleString()}`
                    : ""}{" "}
                  <span className="text-stone-500">({FEE_TIMING_LABELS[f.timing]})</span>
                  {f.description ? ` — ${f.description}` : ""}
                </li>
              ))}
            </ul>
          </section>
        )}

        {property.neighborhoodBlurb && (
          <section className="mt-10 max-w-2xl">
            <h2 className="text-xs font-semibold tracking-wide text-amber-800 uppercase">
              {property.city}, {property.state}
            </h2>
            <p className="mt-3 leading-relaxed text-stone-700">
              {property.neighborhoodBlurb}
            </p>
          </section>
        )}

        {leadPaintGate && (
          <section className="mt-10 rounded-md border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm font-medium text-amber-900">
              About This Home&apos;s Age
            </p>
            <p className="mt-1 text-sm leading-relaxed text-amber-800">
              Built in {property.buildYear}, this property is subject to federal
              lead-based paint disclosure requirements. A full disclosure — including any
              known hazards and an EPA-approved information pamphlet — is provided as part
              of the application, before any lease is signed.
            </p>
          </section>
        )}

        <section className="mt-10 rounded-lg bg-stone-900 px-6 py-8 text-center">
          <h2 className="text-xl font-semibold text-white">Interested in this home?</h2>
          {mailtoHref ? (
            <a
              href={mailtoHref}
              className="mt-4 inline-block rounded-md bg-white px-5 py-2.5 text-sm font-medium text-stone-900 hover:bg-stone-100"
            >
              Request a Showing
            </a>
          ) : (
            <p className="mt-2 text-sm text-stone-400">
              Contact information unavailable.
            </p>
          )}
        </section>

        <footer className="mt-8 pb-10 text-center text-xs text-stone-400">
          Listed by {property.landlord.name || "the property owner"} via Brick and Beam
          <br />
          Equal Housing Opportunity
        </footer>
      </main>
    </div>
  );
}
