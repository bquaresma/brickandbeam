"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireLandlord } from "@/lib/current-user";
import { EMAIL_RE, normalizeEmail } from "@/lib/email";
import { geocodeAddress } from "@/lib/geocode";
import { PROPERTY_STYLES } from "@/lib/details/catalog";
import type { ActionResult } from "@/lib/actions/action-result";

type PropertyData = {
  name: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  zip: string;
  alleyAddress: string | null;
  publicContactEmail: string | null;
  buildYear: number;
  neighborhoodBlurb: string | null;
  propertyStyle: string | null;
  isWholeHouse: boolean;
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
  const publicContactEmail = normalizeEmail(formData.get("publicContactEmail"));
  const buildYearRaw = String(formData.get("buildYear") ?? "").trim();
  const buildYear = Number.parseInt(buildYearRaw, 10);
  const neighborhoodBlurb = String(formData.get("neighborhoodBlurb") ?? "").trim();
  const styleRaw = String(formData.get("propertyStyle") ?? "");
  const propertyStyle = PROPERTY_STYLES.some((s) => s.value === styleRaw)
    ? styleRaw
    : null;
  const isWholeHouse = formData.get("isWholeHouse") === "on";

  if (!addressLine1 || !city || !state || !zip) {
    return { error: "Address, city, state, and zip are required." };
  }
  if (publicContactEmail && !EMAIL_RE.test(publicContactEmail)) {
    return { error: "Enter a valid public contact email, or leave it blank." };
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
      publicContactEmail: publicContactEmail || null,
      buildYear,
      neighborhoodBlurb: neighborhoodBlurb || null,
      propertyStyle,
      isWholeHouse,
    },
  };
}

// Geocoded once per save so the public listing never calls the geocoder.
async function geocodeProperty(data: PropertyData) {
  const [front, alley] = await Promise.all([
    geocodeAddress(`${data.addressLine1}, ${data.city}, ${data.state} ${data.zip}`),
    data.alleyAddress ? geocodeAddress(data.alleyAddress) : Promise.resolve(null),
  ]);
  return {
    latitude: front?.lat ?? null,
    longitude: front?.lng ?? null,
    alleyLatitude: alley?.lat ?? null,
    alleyLongitude: alley?.lng ?? null,
  };
}

export async function createProperty(formData: FormData): Promise<ActionResult> {
  const user = await requireLandlord();
  const parsed = parsePropertyForm(formData);
  if ("error" in parsed) return parsed;

  const property = await prisma.property.create({
    data: {
      ...parsed.data,
      ...(await geocodeProperty(parsed.data)),
      landlordId: user.id,
      // Whole-house properties skip the multi-unit UI, but the schema still
      // needs one Unit to hang the Listing off of — create it now so the
      // property page can go straight to "Add listing" with no extra step.
      units: parsed.data.isWholeHouse ? { create: { name: "Whole house" } } : undefined,
    },
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
    include: { units: true },
  });
  if (!existing) return { error: "Property not found." };

  const needsDefaultUnit = parsed.data.isWholeHouse && existing.units.length === 0;

  await prisma.property.update({
    where: { id: propertyId },
    data: {
      ...parsed.data,
      ...(await geocodeProperty(parsed.data)),
      units: needsDefaultUnit ? { create: { name: "Whole house" } } : undefined,
    },
  });

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
