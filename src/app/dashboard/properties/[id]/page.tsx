import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireLandlord } from "@/lib/current-user";
import { requiresLeadPaintDisclosure } from "@/lib/compliance";
import { deleteProperty } from "@/lib/actions/properties";
import { deleteUnit } from "@/lib/actions/units";
import { deleteListing } from "@/lib/actions/listings";

const LISTING_STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-stone-100 text-stone-700",
  PUBLISHED: "bg-green-100 text-green-800",
  ARCHIVED: "bg-stone-100 text-stone-500",
};

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireLandlord();

  const property = await prisma.property.findFirst({
    where: { id, landlordId: user.id },
    include: {
      units: { orderBy: { createdAt: "asc" }, include: { listing: true } },
    },
  });

  if (!property) notFound();

  const leadPaintGate = requiresLeadPaintDisclosure(property.buildYear);

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#3D2E24]">
            {property.name || property.addressLine1}
          </h1>
          <p className="text-sm text-stone-500">
            {property.addressLine1}
            {property.addressLine2 ? `, ${property.addressLine2}` : ""}, {property.city},{" "}
            {property.state} {property.zip}
          </p>
          <p className="mt-1 text-sm text-stone-500">Built {property.buildYear}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/properties/${property.id}/edit`}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Edit
          </Link>
          <form action={deleteProperty.bind(null, property.id)}>
            <button
              type="submit"
              className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              Delete
            </button>
          </form>
        </div>
      </div>

      {leadPaintGate && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Built before 1978 — the federal lead-based paint disclosure is required before
          any lease is signed or renewed for this property.
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#3D2E24]">Units</h2>
        <Link
          href={`/dashboard/properties/${property.id}/units/new`}
          className="rounded-md bg-[#B1502F] px-3 py-2 text-sm font-medium text-white hover:bg-[#8F3F25]"
        >
          + Add unit
        </Link>
      </div>

      {property.units.length === 0 ? (
        <p className="mt-4 text-sm text-stone-500">No units yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
          {property.units.map((unit) => (
            <li key={unit.id} className="px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-stone-900">{unit.name}</p>
                  <p className="text-sm text-stone-500">
                    {[
                      unit.bedrooms != null ? `${unit.bedrooms} bd` : null,
                      unit.bathrooms != null ? `${unit.bathrooms} ba` : null,
                      unit.squareFeet != null ? `${unit.squareFeet} sqft` : null,
                      unit.rentAmountCents != null
                        ? `$${(unit.rentAmountCents / 100).toLocaleString()}/mo`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "No details yet"}
                  </p>
                  {unit.layoutNotes && (
                    <p className="mt-1 text-sm text-stone-500 italic">
                      {unit.layoutNotes}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/properties/${property.id}/units/${unit.id}/details`}
                    className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
                  >
                    Amenities &amp; utilities
                  </Link>
                  <Link
                    href={`/dashboard/properties/${property.id}/units/${unit.id}/edit`}
                    className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
                  >
                    Edit
                  </Link>
                  <form action={deleteUnit.bind(null, property.id, unit.id)}>
                    <button
                      type="submit"
                      className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-md bg-stone-50 px-3 py-2">
                {unit.listing ? (
                  <>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${LISTING_STATUS_STYLES[unit.listing.status]}`}
                        >
                          {unit.listing.status}
                        </span>
                        <span className="text-sm font-medium text-stone-800">
                          {unit.listing.headline || "Listing"}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-1 text-sm text-stone-500">
                        {unit.listing.story}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {unit.listing.status === "PUBLISHED" && (
                        <Link
                          href={`/listings/${unit.listing.id}`}
                          target="_blank"
                          className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-white"
                        >
                          View public page
                        </Link>
                      )}
                      <Link
                        href={`/dashboard/properties/${property.id}/units/${unit.id}/listing/edit`}
                        className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-white"
                      >
                        Edit listing
                      </Link>
                      <form
                        action={deleteListing.bind(
                          null,
                          property.id,
                          unit.id,
                          unit.listing.id,
                        )}
                      >
                        <button
                          type="submit"
                          className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                        >
                          Delete listing
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-sm text-stone-500">No listing yet</span>
                    <Link
                      href={`/dashboard/properties/${property.id}/units/${unit.id}/listing/new`}
                      className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-white"
                    >
                      + Add listing
                    </Link>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
