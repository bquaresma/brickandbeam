import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireLandlord } from "@/lib/current-user";
import { ListingForm } from "@/components/listing-form";
import { createListing } from "@/lib/actions/listings";

export default async function NewListingPage({
  params,
}: {
  params: Promise<{ id: string; unitId: string }>;
}) {
  const { id, unitId } = await params;
  const user = await requireLandlord();

  const unit = await prisma.unit.findFirst({
    where: { id: unitId, propertyId: id, property: { landlordId: user.id } },
    include: { listing: true },
  });
  if (!unit) notFound();
  if (unit.listing) redirect(`/dashboard/properties/${id}/units/${unitId}/listing/edit`);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#3D2E24]">
        Add a listing for {unit.name}
      </h1>
      <div className="mt-6">
        <ListingForm
          action={createListing.bind(null, id, unitId)}
          submitLabel="Create listing"
        />
      </div>
    </div>
  );
}
