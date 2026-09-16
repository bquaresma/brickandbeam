import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Spectral } from "next/font/google";

import { prisma } from "@/lib/prisma";
import { requiresLeadPaintDisclosure } from "@/lib/compliance";
import { createLead } from "@/lib/actions/leads";
import { FormWithError, SubmitButton } from "@/components/action-form";
import {
  BedIcon,
  BathIcon,
  RulerIcon,
  CarIcon,
  PawIcon,
  ArmchairIcon,
  SmokeOffIcon,
  ShieldIcon,
  MailIcon,
  PlayIcon,
  SparkleIcon,
  HomeIcon,
} from "@/components/listing-icons";

const spectral = Spectral({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-spectral",
});

// Brand palette — "Industrial Heritage". Scoped to this public-facing page
// only; the landlord dashboard stays plain/utilitarian on purpose.
const BRICK = "#9A4635"; // primary accent: CTAs, eyebrows, icons
const TIMBER = "#6B4A34"; // secondary text, borders, dividers
const PLASTER = "#F3E8D8"; // page background
const CHARCOAL = "#262626"; // headings, dark panel
// Brass (#B08A4A) is used directly in `hover:` utility classes below rather
// than via this constant — Tailwind only picks up literal class strings.
const SAGE = "#5f6b52"; // secondary accent (amenities, "allowed" states) — darkened from #8F9B7A for text contrast

// Subtle plaster-grain texture, layered under the flat background color.
const GRAIN_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E\")";

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

function Eyebrow({
  icon,
  children,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <h2
      className="flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase"
      style={{ color: BRICK }}
    >
      {icon}
      {children}
    </h2>
  );
}

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
  searchParams,
}: {
  params: Promise<{ listingId: string }>;
  searchParams: Promise<{ sent?: string }>;
}) {
  const { listingId } = await params;
  const { sent } = await searchParams;
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
    <div
      className={`${spectral.variable} min-h-screen`}
      style={{ backgroundColor: PLASTER, backgroundImage: GRAIN_BG }}
    >
      <header className="border-b bg-white" style={{ borderColor: `${TIMBER}26` }}>
        <div className="mx-auto flex max-w-3xl items-baseline justify-between px-4 py-5">
          <span
            className="text-lg font-semibold"
            style={{ fontFamily: "var(--font-spectral)", color: CHARCOAL }}
          >
            Brick &amp; Beam
          </span>
          <span
            className="text-xs font-medium tracking-wide uppercase"
            style={{ color: `${TIMBER}99` }}
          >
            Historic homes. Warmly rented.
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        {listing.heroPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.heroPhotoUrl}
            alt={listing.headline || unit.name}
            className="aspect-video w-full rounded-xl border object-cover shadow-sm"
            style={{ borderColor: `${TIMBER}26` }}
          />
        ) : (
          <div
            className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-white"
            style={{ borderColor: `${TIMBER}4d`, color: `${TIMBER}99` }}
          >
            <HomeIcon className="h-8 w-8" />
            <span className="text-sm">No photo yet</span>
          </div>
        )}

        <div
          className="mt-7 text-xs font-semibold tracking-wide uppercase"
          style={{ color: BRICK }}
        >
          {property.city}, {property.state}
        </div>
        <h1
          className="mt-2 text-4xl leading-tight font-medium"
          style={{ fontFamily: "var(--font-spectral)", color: CHARCOAL }}
        >
          {listing.headline || unit.name}
        </h1>
        <p className="mt-2 text-sm" style={{ color: `${TIMBER}b3` }}>
          {property.addressLine1}
          {property.addressLine2 ? `, ${property.addressLine2}` : ""}
          {unit.name !== (listing.headline || unit.name) ? ` — ${unit.name}` : ""}
        </p>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-baseline gap-3">
            {unit.rentAmountCents != null && (
              <span
                className="text-3xl font-semibold"
                style={{ fontFamily: "var(--font-spectral)", color: CHARCOAL }}
              >
                ${(unit.rentAmountCents / 100).toLocaleString()}
                <span className="text-base font-normal" style={{ color: `${TIMBER}b3` }}>
                  /mo
                </span>
              </span>
            )}
            <span className="text-sm" style={{ color: `${TIMBER}b3` }}>
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
            <a
              href="#contact"
              className="flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#B08A4A]"
              style={{ backgroundColor: BRICK }}
            >
              <MailIcon className="h-4 w-4" />
              Request a Showing
            </a>
            {listing.virtualTourUrl && (
              <a
                href={listing.virtualTourUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors hover:border-[#B08A4A] hover:text-[#B08A4A]"
                style={{ borderColor: `${TIMBER}4d`, color: CHARCOAL }}
              >
                <PlayIcon className="h-4 w-4" />
                Virtual Tour
              </a>
            )}
          </div>
        </div>

        <div className="mt-7 flex border-y py-5" style={{ borderColor: `${TIMBER}26` }}>
          {unit.bedrooms != null && (
            <div
              className="flex items-center gap-2 border-r pr-4 sm:gap-3 sm:pr-7"
              style={{ borderColor: `${TIMBER}26` }}
            >
              <BedIcon className="h-5 w-5 shrink-0" style={{ color: BRICK }} />
              <div>
                <div className="font-semibold" style={{ color: CHARCOAL }}>
                  {unit.bedrooms}
                </div>
                <div
                  className="text-xs whitespace-nowrap"
                  style={{ color: `${TIMBER}b3` }}
                >
                  Bedrooms
                </div>
              </div>
            </div>
          )}
          {unit.bathrooms != null && (
            <div
              className="flex items-center gap-2 border-r px-4 sm:gap-3 sm:px-7"
              style={{ borderColor: `${TIMBER}26` }}
            >
              <BathIcon className="h-5 w-5 shrink-0" style={{ color: BRICK }} />
              <div>
                <div className="font-semibold" style={{ color: CHARCOAL }}>
                  {unit.bathrooms}
                </div>
                <div
                  className="text-xs whitespace-nowrap"
                  style={{ color: `${TIMBER}b3` }}
                >
                  Bathrooms
                </div>
              </div>
            </div>
          )}
          {unit.squareFeet != null && (
            <div className="flex items-center gap-2 pl-4 sm:gap-3 sm:pl-7">
              <RulerIcon className="h-5 w-5 shrink-0" style={{ color: BRICK }} />
              <div>
                <div className="font-semibold" style={{ color: CHARCOAL }}>
                  {unit.squareFeet}
                </div>
                <div
                  className="text-xs whitespace-nowrap"
                  style={{ color: `${TIMBER}b3` }}
                >
                  Square Feet
                </div>
              </div>
            </div>
          )}
        </div>

        {storyParagraphs.length > 0 && (
          <section className="mt-12 max-w-2xl">
            <Eyebrow>The Story</Eyebrow>
            {listing.previewMessage && (
              <p
                className="mt-4 text-xl leading-relaxed italic"
                style={{ fontFamily: "var(--font-spectral)", color: CHARCOAL }}
              >
                {listing.previewMessage}
              </p>
            )}
            <div className="mt-4 space-y-4 leading-relaxed" style={{ color: "#3d342c" }}>
              {storyParagraphs.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </section>
        )}

        {listing.floorPlanUrl && (
          <section className="mt-12">
            <Eyebrow>The Layout</Eyebrow>
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={listing.floorPlanUrl}
                alt="Floor plan"
                className="rounded-lg border shadow-sm"
                style={{ borderColor: `${TIMBER}26` }}
              />
              {unit.layoutNotes && (
                <div
                  className="rounded-lg border bg-white p-5"
                  style={{ borderColor: `${TIMBER}26` }}
                >
                  <p
                    className="text-base font-medium"
                    style={{ fontFamily: "var(--font-spectral)", color: CHARCOAL }}
                  >
                    Not your standard layout.
                  </p>
                  <p
                    className="mt-2 text-sm leading-relaxed"
                    style={{ color: "#3d342c" }}
                  >
                    {unit.layoutNotes}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {(appliances.length > 0 || amenities.length > 0) && (
          <section className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2">
            {appliances.length > 0 && (
              <div>
                <Eyebrow icon={<HomeIcon className="h-3.5 w-3.5" />}>
                  Appliances Included
                </Eyebrow>
                <div className="mt-3 flex flex-wrap gap-2">
                  {appliances.map((a) => (
                    <span
                      key={a.id}
                      className="rounded-full border bg-white px-3 py-1 text-xs"
                      style={{ borderColor: `${TIMBER}26`, color: CHARCOAL }}
                    >
                      {a.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {amenities.length > 0 && (
              <div>
                <Eyebrow icon={<SparkleIcon className="h-3.5 w-3.5" />}>
                  Amenities
                </Eyebrow>
                <div className="mt-3 flex flex-wrap gap-2">
                  {amenities.map((a) => (
                    <span
                      key={a.id}
                      className="rounded-full border px-3 py-1 text-xs"
                      style={{
                        borderColor: "#8F9B7A66",
                        backgroundColor: "#8F9B7A1a",
                        color: SAGE,
                      }}
                    >
                      {a.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <section
          className="mt-12 flex flex-wrap gap-x-8 gap-y-3 rounded-lg border bg-white px-6 py-5 text-sm shadow-sm"
          style={{ borderColor: `${TIMBER}26`, color: CHARCOAL }}
        >
          {unit.parkingType && (
            <span className="flex items-center gap-2">
              <CarIcon className="h-4 w-4" style={{ color: `${TIMBER}99` }} />
              {PARKING_LABELS[unit.parkingType]}
            </span>
          )}
          {unit.isFurnished != null && (
            <span className="flex items-center gap-2">
              <ArmchairIcon className="h-4 w-4" style={{ color: `${TIMBER}99` }} />
              {unit.isFurnished ? "Furnished" : "Unfurnished"}
            </span>
          )}
          {unit.smokingAllowed != null && (
            <span className="flex items-center gap-2">
              {!unit.smokingAllowed && (
                <SmokeOffIcon className="h-4 w-4" style={{ color: `${TIMBER}99` }} />
              )}
              {unit.smokingAllowed ? "Smoking allowed" : "No smoking"}
            </span>
          )}
        </section>

        {unit.petPolicies.length > 0 && (
          <section className="mt-12">
            <Eyebrow icon={<PawIcon className="h-3.5 w-3.5" />}>Pet Policy</Eyebrow>
            <ul className="mt-3 space-y-1.5 text-sm" style={{ color: "#3d342c" }}>
              {unit.petPolicies.map((p) => (
                <li key={p.id}>
                  {PET_TYPE_LABELS[p.petType]}
                  {p.petSize
                    ? ` (${p.petSize === "SMALL" ? "small" : "large"})`
                    : ""}:{" "}
                  <span
                    className="font-medium"
                    style={{ color: p.allowed ? SAGE : BRICK }}
                  >
                    {p.allowed ? "welcome" : "not allowed"}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {(includedUtilities.length > 0 || tenantUtilities.length > 0) && (
          <section className="mt-12">
            <Eyebrow>What&apos;s Included</Eyebrow>
            <div className="mt-3 space-y-1.5 text-sm" style={{ color: "#3d342c" }}>
              {includedUtilities.length > 0 && (
                <div>
                  <span className="font-medium" style={{ color: CHARCOAL }}>
                    Included in rent:
                  </span>{" "}
                  {includedUtilities.map((u) => UTILITY_LABELS[u.type]).join(", ")}
                </div>
              )}
              {tenantUtilities.length > 0 && (
                <div>
                  <span className="font-medium" style={{ color: CHARCOAL }}>
                    Tenant sets up:
                  </span>{" "}
                  {tenantUtilities.map((u) => UTILITY_LABELS[u.type]).join(", ")}
                </div>
              )}
            </div>
          </section>
        )}

        {unit.fees.length > 0 && (
          <section className="mt-12">
            <Eyebrow>Costs &amp; Fees</Eyebrow>
            <ul className="mt-3 space-y-1.5 text-sm" style={{ color: "#3d342c" }}>
              {unit.fees.map((f) => (
                <li key={f.id}>
                  {FEE_TYPE_LABELS[f.type]}
                  {f.amountCents != null
                    ? ` — $${(f.amountCents / 100).toLocaleString()}`
                    : ""}{" "}
                  <span style={{ color: `${TIMBER}b3` }}>
                    ({FEE_TIMING_LABELS[f.timing]})
                  </span>
                  {f.description ? ` — ${f.description}` : ""}
                </li>
              ))}
            </ul>
          </section>
        )}

        {property.neighborhoodBlurb && (
          <section className="mt-12 max-w-2xl">
            <Eyebrow>
              {property.city}, {property.state}
            </Eyebrow>
            <p className="mt-4 leading-relaxed" style={{ color: "#3d342c" }}>
              {property.neighborhoodBlurb}
            </p>
          </section>
        )}

        {leadPaintGate && (
          <section className="mt-12 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4">
            <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                About This Home&apos;s Age
              </p>
              <p className="mt-1 text-sm leading-relaxed text-amber-800">
                Built in {property.buildYear}, this property is subject to federal
                lead-based paint disclosure requirements. A full disclosure — including
                any known hazards and an EPA-approved information pamphlet — is provided
                as part of the application, before any lease is signed.
              </p>
            </div>
          </section>
        )}

        <section
          id="contact"
          className="mt-12 scroll-mt-8 rounded-xl px-6 py-10"
          style={{ backgroundColor: CHARCOAL }}
        >
          {sent === "true" ? (
            <div className="text-center">
              <h2
                className="text-2xl font-medium text-white"
                style={{ fontFamily: "var(--font-spectral)" }}
              >
                Thanks — your message is on its way.
              </h2>
              <p className="mt-2 text-sm" style={{ color: `${PLASTER}99` }}>
                {property.landlord.name || "The landlord"} typically responds within a
                day.
              </p>
            </div>
          ) : (
            <>
              <h2
                className="text-center text-2xl font-medium text-white"
                style={{ fontFamily: "var(--font-spectral)" }}
              >
                Interested in this home?
              </h2>
              <p className="mt-2 text-center text-sm" style={{ color: `${PLASTER}99` }}>
                Send a message and {property.landlord.name || "the landlord"} will follow
                up directly.
              </p>

              <FormWithError
                action={createLead.bind(null, listing.id)}
                className="mx-auto mt-6 flex max-w-md flex-col gap-3"
                errorClassName="mt-1 text-sm text-red-400"
              >
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Your name"
                  className="rounded-md border px-3 py-2.5 text-sm text-white placeholder-stone-400 focus:outline-none"
                  style={{ backgroundColor: "#2f2f2f", borderColor: "#404040" }}
                />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Email"
                  className="rounded-md border px-3 py-2.5 text-sm text-white placeholder-stone-400 focus:outline-none"
                  style={{ backgroundColor: "#2f2f2f", borderColor: "#404040" }}
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone (optional)"
                  className="rounded-md border px-3 py-2.5 text-sm text-white placeholder-stone-400 focus:outline-none"
                  style={{ backgroundColor: "#2f2f2f", borderColor: "#404040" }}
                />
                <textarea
                  name="message"
                  rows={3}
                  placeholder="I'd like to see this place…"
                  className="rounded-md border px-3 py-2.5 text-sm text-white placeholder-stone-400 focus:outline-none"
                  style={{ backgroundColor: "#2f2f2f", borderColor: "#404040" }}
                />
                <SubmitButton
                  pendingLabel="Sending…"
                  className="rounded-md bg-white px-5 py-2.5 text-sm font-medium transition-colors hover:bg-[#f7ede0] disabled:opacity-50"
                  style={{ color: CHARCOAL }}
                >
                  Send Request
                </SubmitButton>
              </FormWithError>

              {mailtoHref && (
                <p className="mt-4 text-center text-xs" style={{ color: `${PLASTER}80` }}>
                  Prefer email?{" "}
                  <a href={mailtoHref} className="underline hover:text-white">
                    Contact directly
                  </a>
                </p>
              )}
            </>
          )}
        </section>

        <footer
          className="mt-10 border-t pt-6 pb-10 text-center text-xs"
          style={{ borderColor: `${TIMBER}26`, color: `${TIMBER}99` }}
        >
          Listed by {property.landlord.name || "the property owner"} via Brick and Beam
          <br />
          Equal Housing Opportunity
        </footer>
      </main>
    </div>
  );
}
