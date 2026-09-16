"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ParkingType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireLandlord } from "@/lib/current-user";
import type { ActionResult } from "@/lib/actions/action-result";

type UnitData = {
  name: string;
  rentAmountCents: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: number | null;
  layoutNotes: string | null;
  dateAvailable: Date | null;
  isFurnished: boolean;
  smokingAllowed: boolean;
  parkingType: ParkingType | null;
};

function parseUnitForm(formData: FormData): { error: string } | { data: UnitData } {
  const name = String(formData.get("name") ?? "").trim();
  const rentDollarsRaw = String(formData.get("rentDollars") ?? "").trim();
  const bedroomsRaw = String(formData.get("bedrooms") ?? "").trim();
  const bathroomsRaw = String(formData.get("bathrooms") ?? "").trim();
  const squareFeetRaw = String(formData.get("squareFeet") ?? "").trim();
  const layoutNotes = String(formData.get("layoutNotes") ?? "").trim();
  const dateAvailableRaw = String(formData.get("dateAvailable") ?? "").trim();
  const parkingTypeRaw = String(formData.get("parkingType") ?? "").trim();

  if (!name) {
    return { error: "Unit name is required." };
  }

  const rentDollars = rentDollarsRaw ? Number.parseFloat(rentDollarsRaw) : null;
  const bedrooms = bedroomsRaw ? Number.parseFloat(bedroomsRaw) : null;
  const bathrooms = bathroomsRaw ? Number.parseFloat(bathroomsRaw) : null;
  const squareFeet = squareFeetRaw ? Number.parseInt(squareFeetRaw, 10) : null;
  const parkingType = Object.values(ParkingType).includes(parkingTypeRaw as ParkingType)
    ? (parkingTypeRaw as ParkingType)
    : null;

  return {
    data: {
      name,
      rentAmountCents:
        rentDollars !== null && !Number.isNaN(rentDollars)
          ? Math.round(rentDollars * 100)
          : null,
      bedrooms: bedrooms !== null && !Number.isNaN(bedrooms) ? bedrooms : null,
      bathrooms: bathrooms !== null && !Number.isNaN(bathrooms) ? bathrooms : null,
      squareFeet: squareFeet !== null && !Number.isNaN(squareFeet) ? squareFeet : null,
      layoutNotes: layoutNotes || null,
      dateAvailable: dateAvailableRaw ? new Date(dateAvailableRaw) : null,
      isFurnished: formData.get("isFurnished") === "on",
      smokingAllowed: formData.get("smokingAllowed") === "on",
      parkingType,
    },
  };
}

async function assertOwnsProperty(propertyId: string, landlordId: string) {
  const property = await prisma.property.findFirst({
    where: { id: propertyId, landlordId },
  });
  return property;
}

export async function createUnit(
  propertyId: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireLandlord();
  if (!(await assertOwnsProperty(propertyId, user.id))) {
    return { error: "Property not found." };
  }
  const parsed = parseUnitForm(formData);
  if ("error" in parsed) return parsed;

  await prisma.unit.create({ data: { ...parsed.data, propertyId } });

  revalidatePath(`/dashboard/properties/${propertyId}`);
  redirect(`/dashboard/properties/${propertyId}`);
}

export async function updateUnit(
  propertyId: string,
  unitId: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireLandlord();
  if (!(await assertOwnsProperty(propertyId, user.id))) {
    return { error: "Property not found." };
  }
  const parsed = parseUnitForm(formData);
  if ("error" in parsed) return parsed;

  const existing = await prisma.unit.findFirst({ where: { id: unitId, propertyId } });
  if (!existing) return { error: "Unit not found." };

  await prisma.unit.update({ where: { id: unitId }, data: parsed.data });

  revalidatePath(`/dashboard/properties/${propertyId}`);
  redirect(`/dashboard/properties/${propertyId}`);
}

export async function deleteUnit(propertyId: string, unitId: string) {
  const user = await requireLandlord();
  if (!(await assertOwnsProperty(propertyId, user.id))) {
    throw new Error("Property not found.");
  }

  const existing = await prisma.unit.findFirst({ where: { id: unitId, propertyId } });
  if (!existing) throw new Error("Unit not found.");

  await prisma.unit.delete({ where: { id: unitId } });

  revalidatePath(`/dashboard/properties/${propertyId}`);
  redirect(`/dashboard/properties/${propertyId}`);
}
