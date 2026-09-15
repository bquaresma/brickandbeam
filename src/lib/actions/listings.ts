"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ListingStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireLandlord } from "@/lib/current-user";

function parseListingForm(formData: FormData) {
  const headline = String(formData.get("headline") ?? "").trim();
  const previewMessage = String(formData.get("previewMessage") ?? "").trim();
  const story = String(formData.get("story") ?? "").trim();
  const leaseTerm = String(formData.get("leaseTerm") ?? "").trim();
  const virtualTourUrl = String(formData.get("virtualTourUrl") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "DRAFT");

  if (!story) {
    throw new Error("Tell the story of this place — the narrative can't be empty.");
  }
  if (previewMessage.length > 255) {
    throw new Error("Preview message must be 255 characters or fewer.");
  }

  const status = Object.values(ListingStatus).includes(statusRaw as ListingStatus)
    ? (statusRaw as ListingStatus)
    : ListingStatus.DRAFT;

  return {
    headline: headline || null,
    previewMessage: previewMessage || null,
    story,
    leaseTerm: leaseTerm || null,
    virtualTourUrl: virtualTourUrl || null,
    status,
  };
}

async function assertOwnsUnit(propertyId: string, unitId: string, landlordId: string) {
  const unit = await prisma.unit.findFirst({
    where: { id: unitId, propertyId, property: { landlordId } },
  });
  if (!unit) throw new Error("Unit not found.");
  return unit;
}

export async function createListing(
  propertyId: string,
  unitId: string,
  formData: FormData,
) {
  const user = await requireLandlord();
  await assertOwnsUnit(propertyId, unitId, user.id);
  const data = parseListingForm(formData);

  const existing = await prisma.listing.findUnique({ where: { unitId } });
  if (existing) throw new Error("This unit already has a listing.");

  await prisma.listing.create({
    data: {
      ...data,
      unitId,
      publishedAt: data.status === ListingStatus.PUBLISHED ? new Date() : null,
    },
  });

  revalidatePath(`/dashboard/properties/${propertyId}`);
  redirect(`/dashboard/properties/${propertyId}`);
}

export async function updateListing(
  propertyId: string,
  unitId: string,
  listingId: string,
  formData: FormData,
) {
  const user = await requireLandlord();
  await assertOwnsUnit(propertyId, unitId, user.id);
  const data = parseListingForm(formData);

  const existing = await prisma.listing.findFirst({ where: { id: listingId, unitId } });
  if (!existing) throw new Error("Listing not found.");

  const isNewlyPublished =
    data.status === ListingStatus.PUBLISHED &&
    existing.status !== ListingStatus.PUBLISHED;

  await prisma.listing.update({
    where: { id: listingId },
    data: {
      ...data,
      publishedAt: isNewlyPublished ? new Date() : existing.publishedAt,
    },
  });

  revalidatePath(`/dashboard/properties/${propertyId}`);
  redirect(`/dashboard/properties/${propertyId}`);
}

export async function deleteListing(
  propertyId: string,
  unitId: string,
  listingId: string,
) {
  const user = await requireLandlord();
  await assertOwnsUnit(propertyId, unitId, user.id);

  const existing = await prisma.listing.findFirst({ where: { id: listingId, unitId } });
  if (!existing) throw new Error("Listing not found.");

  await prisma.listing.delete({ where: { id: listingId } });

  revalidatePath(`/dashboard/properties/${propertyId}`);
  redirect(`/dashboard/properties/${propertyId}`);
}
