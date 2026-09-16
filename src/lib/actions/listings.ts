"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ListingStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireLandlord } from "@/lib/current-user";
import type { ActionResult } from "@/lib/actions/action-result";

type ListingData = {
  headline: string | null;
  previewMessage: string | null;
  story: string;
  leaseTerm: string | null;
  virtualTourUrl: string | null;
  heroPhotoUrl: string | null;
  floorPlanUrl: string | null;
  status: ListingStatus;
};

function parseListingForm(formData: FormData): { error: string } | { data: ListingData } {
  const headline = String(formData.get("headline") ?? "").trim();
  const previewMessage = String(formData.get("previewMessage") ?? "").trim();
  const story = String(formData.get("story") ?? "").trim();
  const leaseTerm = String(formData.get("leaseTerm") ?? "").trim();
  const virtualTourUrl = String(formData.get("virtualTourUrl") ?? "").trim();
  const heroPhotoUrl = String(formData.get("heroPhotoUrl") ?? "").trim();
  const floorPlanUrl = String(formData.get("floorPlanUrl") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "DRAFT");

  if (!story) {
    return { error: "Tell the story of this place — the narrative can't be empty." };
  }
  if (previewMessage.length > 255) {
    return { error: "Preview message must be 255 characters or fewer." };
  }

  const status = Object.values(ListingStatus).includes(statusRaw as ListingStatus)
    ? (statusRaw as ListingStatus)
    : ListingStatus.DRAFT;

  return {
    data: {
      headline: headline || null,
      previewMessage: previewMessage || null,
      story,
      leaseTerm: leaseTerm || null,
      virtualTourUrl: virtualTourUrl || null,
      heroPhotoUrl: heroPhotoUrl || null,
      floorPlanUrl: floorPlanUrl || null,
      status,
    },
  };
}

async function assertOwnsUnit(propertyId: string, unitId: string, landlordId: string) {
  const unit = await prisma.unit.findFirst({
    where: { id: unitId, propertyId, property: { landlordId } },
  });
  return unit;
}

export async function createListing(
  propertyId: string,
  unitId: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireLandlord();
  if (!(await assertOwnsUnit(propertyId, unitId, user.id))) {
    return { error: "Unit not found." };
  }
  const parsed = parseListingForm(formData);
  if ("error" in parsed) return parsed;

  const existing = await prisma.listing.findUnique({ where: { unitId } });
  if (existing) return { error: "This unit already has a listing." };

  const listing = await prisma.listing.create({
    data: {
      ...parsed.data,
      unitId,
      publishedAt: parsed.data.status === ListingStatus.PUBLISHED ? new Date() : null,
    },
  });

  revalidatePath(`/dashboard/properties/${propertyId}`);
  revalidatePath(`/listings/${listing.id}`);
  redirect(`/dashboard/properties/${propertyId}`);
}

export async function updateListing(
  propertyId: string,
  unitId: string,
  listingId: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireLandlord();
  if (!(await assertOwnsUnit(propertyId, unitId, user.id))) {
    return { error: "Unit not found." };
  }
  const parsed = parseListingForm(formData);
  if ("error" in parsed) return parsed;

  const existing = await prisma.listing.findFirst({ where: { id: listingId, unitId } });
  if (!existing) return { error: "Listing not found." };

  const isNewlyPublished =
    parsed.data.status === ListingStatus.PUBLISHED &&
    existing.status !== ListingStatus.PUBLISHED;

  await prisma.listing.update({
    where: { id: listingId },
    data: {
      ...parsed.data,
      publishedAt: isNewlyPublished ? new Date() : existing.publishedAt,
    },
  });

  revalidatePath(`/dashboard/properties/${propertyId}`);
  revalidatePath(`/listings/${listingId}`);
  redirect(`/dashboard/properties/${propertyId}`);
}

export async function deleteListing(
  propertyId: string,
  unitId: string,
  listingId: string,
) {
  const user = await requireLandlord();
  if (!(await assertOwnsUnit(propertyId, unitId, user.id))) {
    throw new Error("Unit not found.");
  }

  const existing = await prisma.listing.findFirst({ where: { id: listingId, unitId } });
  if (!existing) throw new Error("Listing not found.");

  await prisma.listing.delete({ where: { id: listingId } });

  revalidatePath(`/dashboard/properties/${propertyId}`);
  redirect(`/dashboard/properties/${propertyId}`);
}
