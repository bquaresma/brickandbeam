import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireLandlord } from "@/lib/current-user";
import { UnitForm } from "@/components/unit-form";
import { createUnit } from "@/lib/actions/units";

export default async function NewUnitPage({
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
      <h1 className="text-2xl font-semibold text-stone-900">
        Add a unit to {property.name || property.addressLine1}
      </h1>
      <div className="mt-6">
        <UnitForm action={createUnit.bind(null, property.id)} submitLabel="Add unit" />
      </div>
    </div>
  );
}
