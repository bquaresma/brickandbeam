import { prisma } from "@/lib/prisma";
import { toRecord, visibleQuestions } from "@/lib/questions";
import { toPhotoView } from "@/lib/images/view";
import { buildFacts } from "./facts";
import { checkCopy } from "./fairhousing";
import { buildKits } from "./kits";
import type { KitPhoto } from "./photos";

// Everything the share and flyer pages need, for a unit the landlord owns.
export async function loadKit(propertyId: string, unitId: string, landlordId: string) {
  const unit = await prisma.unit.findFirst({
    where: { id: unitId, propertyId, property: { landlordId } },
    include: {
      property: true,
      amenities: true,
      petPolicies: true,
      fees: true,
      utilities: true,
      listing: {
        include: { photos: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
      },
    },
  });
  if (!unit?.listing) return null;

  const questions = (await visibleQuestions(landlordId)).map(toRecord);
  const facts = buildFacts({
    property: unit.property,
    unit,
    listing: unit.listing,
    amenities: unit.amenities,
    petPolicies: unit.petPolicies,
    fees: unit.fees,
    utilities: unit.utilities,
    questions,
  });

  const photos = unit.listing.photos.map(toPhotoView);
  const kitPhotos: KitPhoto[] = photos.map((p) => ({
    kind: p.kind,
    area: p.area,
    level: p.level,
    isHero: p.isHero,
    sortOrder: p.sortOrder,
    variants: p.variants,
  }));

  // The words the landlord wrote, plus the features and quirks pulled into ads.
  const findings = checkCopy([
    { where: "Headline", text: unit.listing.headline },
    { where: "Preview message", text: unit.listing.previewMessage },
    { where: "Story", text: unit.listing.story },
    { where: "Neighborhood blurb", text: unit.property.neighborhoodBlurb },
    { where: "Features in the ads", text: facts.highlights.join(". ") },
    { where: "“Worth knowing” in the ads", text: facts.quirks.join(". ") },
  ]);

  // What would make the ads better, in plain words.
  const missing = [
    facts.rentCents == null ? "the monthly rent (unit details)" : null,
    facts.bedrooms == null ? "the number of bedrooms (unit details)" : null,
    facts.dateAvailable == null ? "the date it's available (unit details)" : null,
    !facts.contactEmail && !facts.contactPhone
      ? "a public email or phone (property form)"
      : null,
    photos.filter((p) => p.kind === "PHOTO").length === 0
      ? "photos (listing edit page)"
      : null,
  ].filter((m): m is string => !!m);

  return {
    unit,
    listing: unit.listing,
    property: unit.property,
    facts,
    kits: buildKits(facts),
    photos,
    kitPhotos,
    findings,
    missing,
  };
}
