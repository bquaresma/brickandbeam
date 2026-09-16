"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AmenityCategory,
  FeeRequirement,
  FeeTiming,
  FeeType,
  PetType,
  PetSize,
  UtilityType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireLandlord } from "@/lib/current-user";
import type { ActionResult } from "@/lib/actions/action-result";

async function assertOwnsUnit(propertyId: string, unitId: string, landlordId: string) {
  const unit = await prisma.unit.findFirst({
    where: { id: unitId, propertyId, property: { landlordId } },
  });
  return unit;
}

async function revalidateUnitDetail(propertyId: string, unitId: string) {
  revalidatePath(`/dashboard/properties/${propertyId}/units/${unitId}/details`);
  const listing = await prisma.listing.findUnique({ where: { unitId } });
  if (listing) revalidatePath(`/listings/${listing.id}`);
}

export async function addAmenity(
  propertyId: string,
  unitId: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireLandlord();
  if (!(await assertOwnsUnit(propertyId, unitId, user.id))) {
    return { error: "Unit not found." };
  }

  const label = String(formData.get("label") ?? "").trim();
  const categoryRaw = String(formData.get("category") ?? "AMENITY");
  if (!label) return { error: "Enter a name for the amenity or appliance." };

  const category = Object.values(AmenityCategory).includes(categoryRaw as AmenityCategory)
    ? (categoryRaw as AmenityCategory)
    : AmenityCategory.AMENITY;

  await prisma.amenity.create({ data: { unitId, label, category } });

  await revalidateUnitDetail(propertyId, unitId);
  redirect(`/dashboard/properties/${propertyId}/units/${unitId}/details`);
}

export async function deleteAmenity(
  propertyId: string,
  unitId: string,
  amenityId: string,
) {
  const user = await requireLandlord();
  if (!(await assertOwnsUnit(propertyId, unitId, user.id))) {
    throw new Error("Unit not found.");
  }

  const existing = await prisma.amenity.findFirst({ where: { id: amenityId, unitId } });
  if (!existing) throw new Error("Amenity not found.");

  await prisma.amenity.delete({ where: { id: amenityId } });

  await revalidateUnitDetail(propertyId, unitId);
  redirect(`/dashboard/properties/${propertyId}/units/${unitId}/details`);
}

const UTILITY_STATUS = {
  NA: "NA",
  INCLUDED: "INCLUDED",
  TENANT_PAYS: "TENANT_PAYS",
} as const;

export async function setUtilities(
  propertyId: string,
  unitId: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireLandlord();
  if (!(await assertOwnsUnit(propertyId, unitId, user.id))) {
    return { error: "Unit not found." };
  }

  const rows: { unitId: string; type: UtilityType; included: boolean }[] = [];
  for (const type of Object.values(UtilityType)) {
    const status = String(formData.get(`utility_${type}`) ?? UTILITY_STATUS.NA);
    if (status === UTILITY_STATUS.INCLUDED) {
      rows.push({ unitId, type, included: true });
    } else if (status === UTILITY_STATUS.TENANT_PAYS) {
      rows.push({ unitId, type, included: false });
    }
  }

  await prisma.$transaction([
    prisma.utility.deleteMany({ where: { unitId } }),
    prisma.utility.createMany({ data: rows }),
  ]);

  await revalidateUnitDetail(propertyId, unitId);
  redirect(`/dashboard/properties/${propertyId}/units/${unitId}/details`);
}

export async function addPetPolicy(
  propertyId: string,
  unitId: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireLandlord();
  if (!(await assertOwnsUnit(propertyId, unitId, user.id))) {
    return { error: "Unit not found." };
  }

  const petTypeRaw = String(formData.get("petType") ?? "");
  const petSizeRaw = String(formData.get("petSize") ?? "");
  const allowed = formData.get("allowed") === "on";

  if (!Object.values(PetType).includes(petTypeRaw as PetType)) {
    return { error: "Choose a pet type." };
  }
  const petType = petTypeRaw as PetType;
  const petSize = Object.values(PetSize).includes(petSizeRaw as PetSize)
    ? (petSizeRaw as PetSize)
    : null;

  await prisma.petPolicy.create({ data: { unitId, petType, petSize, allowed } });

  await revalidateUnitDetail(propertyId, unitId);
  redirect(`/dashboard/properties/${propertyId}/units/${unitId}/details`);
}

export async function deletePetPolicy(
  propertyId: string,
  unitId: string,
  petPolicyId: string,
) {
  const user = await requireLandlord();
  if (!(await assertOwnsUnit(propertyId, unitId, user.id))) {
    throw new Error("Unit not found.");
  }

  const existing = await prisma.petPolicy.findFirst({
    where: { id: petPolicyId, unitId },
  });
  if (!existing) throw new Error("Pet policy not found.");

  await prisma.petPolicy.delete({ where: { id: petPolicyId } });

  await revalidateUnitDetail(propertyId, unitId);
  redirect(`/dashboard/properties/${propertyId}/units/${unitId}/details`);
}

export async function addFee(
  propertyId: string,
  unitId: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireLandlord();
  if (!(await assertOwnsUnit(propertyId, unitId, user.id))) {
    return { error: "Unit not found." };
  }

  const typeRaw = String(formData.get("type") ?? "");
  const timingRaw = String(formData.get("timing") ?? "");
  const requirementRaw = String(formData.get("requirement") ?? "MANDATORY");
  const amountDollarsRaw = String(formData.get("amountDollars") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!Object.values(FeeType).includes(typeRaw as FeeType)) {
    return { error: "Choose a fee type." };
  }
  if (!Object.values(FeeTiming).includes(timingRaw as FeeTiming)) {
    return { error: "Choose when this fee applies." };
  }

  const amountDollars = amountDollarsRaw ? Number.parseFloat(amountDollarsRaw) : null;
  const requirement = Object.values(FeeRequirement).includes(
    requirementRaw as FeeRequirement,
  )
    ? (requirementRaw as FeeRequirement)
    : FeeRequirement.MANDATORY;

  await prisma.fee.create({
    data: {
      unitId,
      type: typeRaw as FeeType,
      timing: timingRaw as FeeTiming,
      requirement,
      amountCents:
        amountDollars !== null && !Number.isNaN(amountDollars)
          ? Math.round(amountDollars * 100)
          : null,
      description: description || null,
    },
  });

  await revalidateUnitDetail(propertyId, unitId);
  redirect(`/dashboard/properties/${propertyId}/units/${unitId}/details`);
}

export async function deleteFee(propertyId: string, unitId: string, feeId: string) {
  const user = await requireLandlord();
  if (!(await assertOwnsUnit(propertyId, unitId, user.id))) {
    throw new Error("Unit not found.");
  }

  const existing = await prisma.fee.findFirst({ where: { id: feeId, unitId } });
  if (!existing) throw new Error("Fee not found.");

  await prisma.fee.delete({ where: { id: feeId } });

  await revalidateUnitDetail(propertyId, unitId);
  redirect(`/dashboard/properties/${propertyId}/units/${unitId}/details`);
}
