import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { convertAndStore, deleteStored, newPhotoId } from "@/lib/images/store";
import { ImageError, MAX_UPLOAD_BYTES } from "@/lib/images/formats";
import { PHOTO_AREAS, toPhotoView, type PhotoAreaName } from "@/lib/images/view";

// A multipart route handler rather than a Server Action: actions are capped at
// 1 MB by default, and a phone photo is several MB.
const MAX_PHOTOS_PER_LISTING = 60;

const json = (body: unknown, status = 200) => Response.json(body, { status });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "LANDLORD") {
    return json({ error: "Sign in to upload photos." }, 401);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "That upload could not be read." }, 400);
  }

  const file = form.get("file");
  const listingId = String(form.get("listingId") ?? "");
  const kind = form.get("kind") === "FLOOR_PLAN" ? "FLOOR_PLAN" : "PHOTO";
  const areaRaw = String(form.get("area") ?? "OTHER");
  const area: PhotoAreaName = (PHOTO_AREAS as readonly string[]).includes(areaRaw)
    ? (areaRaw as PhotoAreaName)
    : "OTHER";
  const level =
    String(form.get("level") ?? "")
      .trim()
      .slice(0, 40) || null;

  if (!(file instanceof File) || file.size === 0) {
    return json({ error: "Choose an image to upload." }, 400);
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return json({ error: "That file is larger than 30 MB." }, 413);
  }

  // Ownership: listing -> unit -> property -> landlord.
  const listing = await prisma.listing.findFirst({
    where: { id: listingId, unit: { property: { landlordId: session.user.id } } },
    select: { id: true },
  });
  if (!listing) return json({ error: "Listing not found." }, 404);

  const existing = await prisma.listingPhoto.findMany({
    where: { listingId },
    select: { sortOrder: true, isHero: true, kind: true },
  });
  if (existing.length >= MAX_PHOTOS_PER_LISTING) {
    return json(
      { error: `A listing can have up to ${MAX_PHOTOS_PER_LISTING} images.` },
      409,
    );
  }

  const photoId = newPhotoId();
  let stored;
  try {
    stored = await convertAndStore(
      listingId,
      photoId,
      Buffer.from(await file.arrayBuffer()),
      kind,
    );
  } catch (error) {
    if (error instanceof ImageError) {
      return json({ error: error.message, code: error.code }, 422);
    }
    console.error("Photo conversion failed", error);
    return json({ error: "We couldn't process that image. Please try another." }, 500);
  }

  try {
    const row = await prisma.listingPhoto.create({
      data: {
        id: photoId,
        listingId,
        kind,
        area,
        level,
        sortOrder: Math.max(-1, ...existing.map((p) => p.sortOrder)) + 1,
        // The first regular photo becomes the hero.
        isHero: kind === "PHOTO" && !existing.some((p) => p.kind === "PHOTO" && p.isHero),
        masterKey: stored.masterKey,
        contentType: stored.contentType,
        bytes: stored.bytes,
        width: stored.width,
        height: stored.height,
        placeholder: stored.placeholder,
        variants: stored.variants,
      },
    });
    // One floor plan per level: a new upload replaces the old one.
    if (kind === "FLOOR_PLAN" && level) {
      const replaced = await prisma.listingPhoto.findMany({
        where: { listingId, kind: "FLOOR_PLAN", level, id: { not: photoId } },
      });
      for (const old of replaced) {
        await prisma.listingPhoto.delete({ where: { id: old.id } });
        await deleteStored(old).catch((e) =>
          console.error("Removing replaced plan failed", e),
        );
      }
    }
    return json({ photo: toPhotoView(row) }, 201);
  } catch (error) {
    await deleteStored(stored).catch(() => undefined);
    console.error("Saving photo failed", error);
    return json({ error: "We couldn't save that image. Please try again." }, 500);
  }
}
