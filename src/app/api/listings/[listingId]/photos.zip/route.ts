import { zipSync } from "fflate";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStorage } from "@/lib/adapters/storage";
import { zipEntries } from "@/lib/channels/photos";
import { toPhotoView } from "@/lib/images/view";

// The numbered photo set to upload to the listing sites. Owner only, drafts
// included. JPEGs don't compress further, so the archive just stores them.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ listingId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "LANDLORD") {
    return new Response("Sign in to download photos.", { status: 401 });
  }

  const { listingId } = await params;
  const listing = await prisma.listing.findFirst({
    where: { id: listingId, unit: { property: { landlordId: session.user.id } } },
    include: {
      photos: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      unit: { include: { property: { select: { addressLine1: true } } } },
    },
  });
  if (!listing) return new Response("Not found", { status: 404 });

  const entries = zipEntries(
    listing.photos.map(toPhotoView).map((p) => ({
      kind: p.kind,
      area: p.area,
      level: p.level,
      isHero: p.isHero,
      sortOrder: p.sortOrder,
      variants: p.variants,
    })),
  );
  if (entries.length === 0)
    return new Response("This listing has no photos yet.", { status: 404 });

  const storage = getStorage();
  const files: Record<string, Uint8Array> = {};
  for (const entry of entries) {
    const stored = await storage.get(entry.key);
    if (stored) files[entry.name] = new Uint8Array(stored.body);
  }
  if (Object.keys(files).length === 0)
    return new Response("The photo files are missing.", { status: 404 });

  const archive = zipSync(files, { level: 0 });
  const name = listing.unit.property.addressLine1
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return new Response(new Uint8Array(archive), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${name || "listing"}-photos.zip"`,
      "Cache-Control": "private, no-store",
    },
  });
}
