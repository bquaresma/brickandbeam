"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireLandlord } from "@/lib/current-user";
import type { ActionResult } from "@/lib/actions/action-result";

type PropertyData = {
  name: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  zip: string;
  alleyAddress: string | null;
  buildYear: number;
  neighborhoodBlurb: string | null;
};

function parsePropertyForm(
  formData: FormData,
): { error: string } | { data: PropertyData } {
  const name = String(formData.get("name") ?? "").trim();
  const addressLine1 = String(formData.get("addressLine1") ?? "").trim();
  const addressLine2 = String(formData.get("addressLine2") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const zip = String(formData.get("zip") ?? "").trim();
  const alleyAddress = String(formData.get("alleyAddress") ?? "").trim();
  const buildYearRaw = String(formData.get("buildYear") ?? "").trim();
  const buildYear = Number.parseInt(buildYearRaw, 10);
  const neighborhoodBlurb = String(formData.get("neighborhoodBlurb") ?? "").trim();

  if (!addressLine1 || !city || !state || !zip) {
    return { error: "Address, city, state, and zip are required." };
  }
  if (
    !Number.isInteger(buildYear) ||
    buildYear < 1600 ||
    buildYear > new Date().getFullYear()
  ) {
    return { error: "Enter a valid build year." };
  }

  return {
    data: {
      name: name || null,
      addressLine1,
      addressLine2: addressLine2 || null,
      city,
      state,
      zip,
      alleyAddress: alleyAddress || null,
      buildYear,
      neighborhoodBlurb: neighborhoodBlurb || null,
    },
  };
}

export async function createProperty(formData: FormData): Promise<ActionResult> {
  const user = await requireLandlord();
  const parsed = parsePropertyForm(formData);
  if ("error" in parsed) return parsed;

  const property = await prisma.property.create({
    data: { ...parsed.data, landlordId: user.id },
  });

  revalidatePath("/dashboard");
  redirect(`/dashboard/properties/${property.id}`);
}

export async function updateProperty(
  propertyId: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireLandlord();
  const parsed = parsePropertyForm(formData);
  if ("error" in parsed) return parsed;

  const existing = await prisma.property.findFirst({
    where: { id: propertyId, landlordId: user.id },
  });
  if (!existing) return { error: "Property not found." };

  await prisma.property.update({ where: { id: propertyId }, data: parsed.data });

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
