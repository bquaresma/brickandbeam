import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStorage } from "@/lib/adapters/storage";

// Serves converted images: listings/<listingId>/<photoId>/<hash>/<file>.
// Masters (4 path segments, never matched below) are not served at all.
const FILE_RE = /^(display|plan|share|export)-[0-9x]+\.(avif|webp|jpg|png)$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key: segments } = await params;
  if (segments.length !== 5 || segments[0] !== "listings" || !FILE_RE.test(segments[4])) {
    return new Response("Not found", { status: 404 });
  }
  const listingId = segments[1];

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      status: true,
      unit: { select: { property: { select: { landlordId: true } } } },
    },
  });
  if (!listing) return new Response("Not found", { status: 404 });

  // Draft and archived images are visible to the owning landlord only.
  const isPublic = listing.status === "PUBLISHED";
  if (!isPublic) {
    const session = await auth();
    if (session?.user?.id !== listing.unit.property.landlordId) {
      return new Response("Not found", { status: 404 });
    }
  }

  const stored = await getStorage().get(segments.join("/"));
  if (!stored) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(stored.body), {
    headers: {
      "Content-Type": stored.contentType,
      "Content-Length": String(stored.body.length),
      // Each variant set lives under a content-hashed folder, so it never changes.
      "Cache-Control": isPublic
        ? "public, max-age=31536000, immutable"
        : "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
