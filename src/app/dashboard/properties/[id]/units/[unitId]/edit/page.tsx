import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireLandlord } from "@/lib/current-user";
import { UnitForm } from "@/components/unit-form";
import { updateUnit } from "@/lib/actions/units";

export default async function EditUnitPage({
  params,
}: {
  params: Promise<{ id: string; unitId: string }>;
}) {
  const { id, unitId } = await params;
  const user = await requireLandlord();

  const property = await prisma.property.findFirst({
    where: { id, landlordId: user.id },
  });
  if (!property) notFound();

  const unit = await prisma.unit.findFirst({
    where: { id: unitId, propertyId: property.id },
  });
  if (!unit) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-900">Edit {unit.name}</h1>
      <div className="mt-6">
        <UnitForm
          action={updateUnit.bind(null, property.id, unit.id)}
          defaultValues={unit}
          submitLabel="Save changes"
        />
      </div>
    </div>
  );
}
