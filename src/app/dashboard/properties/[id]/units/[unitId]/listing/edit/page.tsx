import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireLandlord } from "@/lib/current-user";
import { ListingForm } from "@/components/listing-form";
import { updateListing } from "@/lib/actions/listings";

export default async function EditListingPage({
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
  if (!unit?.listing) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#3D2E24]">
        Edit listing for {unit.name}
      </h1>
      <div className="mt-6">
        <ListingForm
          action={updateListing.bind(null, id, unitId, unit.listing.id)}
          defaultValues={unit.listing}
          submitLabel="Save changes"
        />
      </div>
    </div>
  );
}
