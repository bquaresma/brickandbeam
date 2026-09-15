import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireLandlord } from "@/lib/current-user";
import { PropertyForm } from "@/components/property-form";
import { updateProperty } from "@/lib/actions/properties";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireLandlord();

  const property = await prisma.property.findFirst({
    where: { id, landlordId: user.id },
  });

  if (!property) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-900">Edit property</h1>
      <div className="mt-6">
        <PropertyForm
          action={updateProperty.bind(null, property.id)}
          defaultValues={property}
          submitLabel="Save changes"
        />
      </div>
    </div>
  );
}
