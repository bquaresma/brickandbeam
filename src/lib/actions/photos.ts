"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireLandlord } from "@/lib/current-user";
import { deleteStored } from "@/lib/images/store";
import { PHOTO_AREAS, type PhotoAreaName } from "@/lib/images/view";
import type { ActionResult } from "@/lib/actions/action-result";

// Ownership: photo -> listing -> unit -> property -> landlord.
async function findOwnedPhoto(photoId: string, landlordId: string) {
  return prisma.listingPhoto.findFirst({
    where: { id: photoId, listing: { unit: { property: { landlordId } } } },
  });
}

function refresh(listingId: string) {
  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/dashboard", "layout");
}

export async function updatePhoto(
  photoId: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireLandlord();
  const photo = await findOwnedPhoto(photoId, user.id);
  if (!photo) return { error: "Photo not found." };

  const areaRaw = String(formData.get("area") ?? photo.area);
  const area: PhotoAreaName = (PHOTO_AREAS as readonly string[]).includes(areaRaw)
    ? (areaRaw as PhotoAreaName)
    : "OTHER";
  const caption = String(formData.get("caption") ?? "").trim();
  const altText = String(formData.get("altText") ?? "").trim();
  const level = String(formData.get("level") ?? "").trim();
  if (caption.length > 200 || altText.length > 300 || level.length > 40) {
    return { error: "That text is too long." };
  }

  await prisma.listingPhoto.update({
    where: { id: photoId },
    data: {
      area,
      caption: caption || null,
      altText: altText || null,
      level: level || null,
    },
  });
  refresh(photo.listingId);
}

export async function setHeroPhoto(photoId: string): Promise<ActionResult> {
  const user = await requireLandlord();
  const photo = await findOwnedPhoto(photoId, user.id);
  if (!photo) return { error: "Photo not found." };
  if (photo.kind !== "PHOTO")
    return { error: "Only regular photos can be the hero image." };

  await prisma.$transaction([
    prisma.listingPhoto.updateMany({
      where: { listingId: photo.listingId, isHero: true },
      data: { isHero: false },
    }),
    prisma.listingPhoto.update({ where: { id: photoId }, data: { isHero: true } }),
  ]);
  refresh(photo.listingId);
}

// Swap with the neighbouring photo of the same kind.
export async function movePhoto(
  photoId: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  const user = await requireLandlord();
  const photo = await findOwnedPhoto(photoId, user.id);
  if (!photo) return { error: "Photo not found." };

  const siblings = await prisma.listingPhoto.findMany({
    where: { listingId: photo.listingId, kind: photo.kind },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  const index = siblings.findIndex((s) => s.id === photoId);
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= siblings.length) return;

  const order = siblings.map((s) => s.id);
  [order[index], order[target]] = [order[target], order[index]];
  // Rewrite a dense order so ties and gaps can't build up.
  await prisma.$transaction(
    order.map((id, position) =>
      prisma.listingPhoto.update({ where: { id }, data: { sortOrder: position } }),
    ),
  );
  refresh(photo.listingId);
}

export async function deletePhoto(photoId: string): Promise<ActionResult> {
  const user = await requireLandlord();
  const photo = await findOwnedPhoto(photoId, user.id);
  if (!photo) return { error: "Photo not found." };

  await prisma.listingPhoto.delete({ where: { id: photoId } });
  // Files go after the row so a failure can never leave a row pointing at nothing.
  await deleteStored(photo).catch((error) =>
    console.error("Deleting photo files failed", error),
  );

  // Keep a hero: promote the first remaining regular photo.
  if (photo.isHero) {
    const next = await prisma.listingPhoto.findFirst({
      where: { listingId: photo.listingId, kind: "PHOTO" },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true },
    });
    if (next) {
      await prisma.listingPhoto.update({
        where: { id: next.id },
        data: { isHero: true },
      });
    }
  }
  refresh(photo.listingId);
}
