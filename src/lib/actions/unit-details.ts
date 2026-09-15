"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AmenityCategory, UtilityType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireLandlord } from "@/lib/current-user";

async function assertOwnsUnit(propertyId: string, unitId: string, landlordId: string) {
  const unit = await prisma.unit.findFirst({
    where: { id: unitId, propertyId, property: { landlordId } },
  });
  if (!unit) throw new Error("Unit not found.");
  return unit;
}

export async function addAmenity(propertyId: string, unitId: string, formData: FormData) {
  const user = await requireLandlord();
  await assertOwnsUnit(propertyId, unitId, user.id);

  const label = String(formData.get("label") ?? "").trim();
  const categoryRaw = String(formData.get("category") ?? "AMENITY");
  if (!label) throw new Error("Enter a name for the amenity or appliance.");

  const category = Object.values(AmenityCategory).includes(categoryRaw as AmenityCategory)
    ? (categoryRaw as AmenityCategory)
    : AmenityCategory.AMENITY;

  await prisma.amenity.create({ data: { unitId, label, category } });

  revalidatePath(`/dashboard/properties/${propertyId}/units/${unitId}/details`);
  redirect(`/dashboard/properties/${propertyId}/units/${unitId}/details`);
}

export async function deleteAmenity(
  propertyId: string,
  unitId: string,
  amenityId: string,
) {
  const user = await requireLandlord();
  await assertOwnsUnit(propertyId, unitId, user.id);

  const existing = await prisma.amenity.findFirst({ where: { id: amenityId, unitId } });
  if (!existing) throw new Error("Amenity not found.");

  await prisma.amenity.delete({ where: { id: amenityId } });

  revalidatePath(`/dashboard/properties/${propertyId}/units/${unitId}/details`);
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
) {
  const user = await requireLandlord();
  await assertOwnsUnit(propertyId, unitId, user.id);

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

  revalidatePath(`/dashboard/properties/${propertyId}/units/${unitId}/details`);
  redirect(`/dashboard/properties/${propertyId}/units/${unitId}/details`);
}
