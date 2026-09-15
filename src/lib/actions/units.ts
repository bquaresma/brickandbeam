"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireLandlord } from "@/lib/current-user";

function parseUnitForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const rentDollarsRaw = String(formData.get("rentDollars") ?? "").trim();
  const bedroomsRaw = String(formData.get("bedrooms") ?? "").trim();
  const bathroomsRaw = String(formData.get("bathrooms") ?? "").trim();
  const squareFeetRaw = String(formData.get("squareFeet") ?? "").trim();
  const layoutNotes = String(formData.get("layoutNotes") ?? "").trim();

  if (!name) {
    throw new Error("Unit name is required.");
  }

  const rentDollars = rentDollarsRaw ? Number.parseFloat(rentDollarsRaw) : null;
  const bedrooms = bedroomsRaw ? Number.parseFloat(bedroomsRaw) : null;
  const bathrooms = bathroomsRaw ? Number.parseFloat(bathroomsRaw) : null;
  const squareFeet = squareFeetRaw ? Number.parseInt(squareFeetRaw, 10) : null;

  return {
    name,
    rentAmountCents:
      rentDollars !== null && !Number.isNaN(rentDollars)
        ? Math.round(rentDollars * 100)
        : null,
    bedrooms: bedrooms !== null && !Number.isNaN(bedrooms) ? bedrooms : null,
    bathrooms: bathrooms !== null && !Number.isNaN(bathrooms) ? bathrooms : null,
    squareFeet: squareFeet !== null && !Number.isNaN(squareFeet) ? squareFeet : null,
    layoutNotes: layoutNotes || null,
  };
}

async function assertOwnsProperty(propertyId: string, landlordId: string) {
  const property = await prisma.property.findFirst({
    where: { id: propertyId, landlordId },
  });
  if (!property) throw new Error("Property not found.");
  return property;
}

export async function createUnit(propertyId: string, formData: FormData) {
  const user = await requireLandlord();
  await assertOwnsProperty(propertyId, user.id);
  const data = parseUnitForm(formData);

  await prisma.unit.create({ data: { ...data, propertyId } });

  revalidatePath(`/dashboard/properties/${propertyId}`);
  redirect(`/dashboard/properties/${propertyId}`);
}

export async function updateUnit(propertyId: string, unitId: string, formData: FormData) {
  const user = await requireLandlord();
  await assertOwnsProperty(propertyId, user.id);
  const data = parseUnitForm(formData);

  const existing = await prisma.unit.findFirst({ where: { id: unitId, propertyId } });
  if (!existing) throw new Error("Unit not found.");

  await prisma.unit.update({ where: { id: unitId }, data });

  revalidatePath(`/dashboard/properties/${propertyId}`);
  redirect(`/dashboard/properties/${propertyId}`);
}

export async function deleteUnit(propertyId: string, unitId: string) {
  const user = await requireLandlord();
  await assertOwnsProperty(propertyId, user.id);

  const existing = await prisma.unit.findFirst({ where: { id: unitId, propertyId } });
  if (!existing) throw new Error("Unit not found.");

  await prisma.unit.delete({ where: { id: unitId } });

  revalidatePath(`/dashboard/properties/${propertyId}`);
  redirect(`/dashboard/properties/${propertyId}`);
}
