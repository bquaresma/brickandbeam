"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireLandlord } from "@/lib/current-user";

function parsePropertyForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const addressLine1 = String(formData.get("addressLine1") ?? "").trim();
  const addressLine2 = String(formData.get("addressLine2") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const zip = String(formData.get("zip") ?? "").trim();
  const buildYearRaw = String(formData.get("buildYear") ?? "").trim();
  const buildYear = Number.parseInt(buildYearRaw, 10);

  if (!addressLine1 || !city || !state || !zip) {
    throw new Error("Address, city, state, and zip are required.");
  }
  if (
    !Number.isInteger(buildYear) ||
    buildYear < 1600 ||
    buildYear > new Date().getFullYear()
  ) {
    throw new Error("Enter a valid build year.");
  }

  return {
    name: name || null,
    addressLine1,
    addressLine2: addressLine2 || null,
    city,
    state,
    zip,
    buildYear,
  };
}

export async function createProperty(formData: FormData) {
  const user = await requireLandlord();
  const data = parsePropertyForm(formData);

  const property = await prisma.property.create({
    data: { ...data, landlordId: user.id },
  });

  revalidatePath("/dashboard");
  redirect(`/dashboard/properties/${property.id}`);
}

export async function updateProperty(propertyId: string, formData: FormData) {
  const user = await requireLandlord();
  const data = parsePropertyForm(formData);

  const existing = await prisma.property.findFirst({
    where: { id: propertyId, landlordId: user.id },
  });
  if (!existing) throw new Error("Property not found.");

  await prisma.property.update({ where: { id: propertyId }, data });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/properties/${propertyId}`);
  redirect(`/dashboard/properties/${propertyId}`);
}

export async function deleteProperty(propertyId: string) {
  const user = await requireLandlord();

  const existing = await prisma.property.findFirst({
    where: { id: propertyId, landlordId: user.id },
  });
  if (!existing) throw new Error("Property not found.");

  await prisma.property.delete({ where: { id: propertyId } });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
