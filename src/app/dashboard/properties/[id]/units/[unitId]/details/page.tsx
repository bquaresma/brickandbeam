import { notFound } from "next/navigation";
import { UtilityType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireLandlord } from "@/lib/current-user";
import { addAmenity, deleteAmenity, setUtilities } from "@/lib/actions/unit-details";

const UTILITY_LABELS: Record<UtilityType, string> = {
  WATER: "Water",
  GAS: "Gas",
  ELECTRIC: "Electric",
  TRASH: "Trash",
  SEWER: "Sewer",
  INTERNET: "Internet",
  CABLE: "Cable",
  OTHER: "Other",
};

const UTILITY_TYPES = Object.values(UtilityType);

export default async function UnitDetailsPage({
  params,
}: {
  params: Promise<{ id: string; unitId: string }>;
}) {
  const { id, unitId } = await params;
  const user = await requireLandlord();

  const unit = await prisma.unit.findFirst({
    where: { id: unitId, propertyId: id, property: { landlordId: user.id } },
    include: {
      amenities: { orderBy: { createdAt: "asc" } },
      utilities: true,
    },
  });
  if (!unit) notFound();

  const appliances = unit.amenities.filter((a) => a.category === "APPLIANCE");
  const amenities = unit.amenities.filter((a) => a.category === "AMENITY");
  const utilityByType = new Map(unit.utilities.map((u) => [u.type, u.included]));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">
          Amenities &amp; utilities for {unit.name}
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          These show up on the unit&apos;s public listing once that page exists.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">
          Appliances &amp; amenities
        </h2>

        <div className="rounded-lg border border-stone-200 bg-white p-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-stone-700">Appliances included</h3>
              {appliances.length === 0 ? (
                <p className="mt-2 text-sm text-stone-400">None added yet.</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {appliances.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between rounded-md bg-stone-50 px-3 py-1.5 text-sm text-stone-800"
                    >
                      {a.label}
                      <form action={deleteAmenity.bind(null, id, unitId, a.id)}>
                        <button
                          type="submit"
                          className="text-xs font-medium text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-stone-700">Amenities</h3>
              {amenities.length === 0 ? (
                <p className="mt-2 text-sm text-stone-400">None added yet.</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {amenities.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between rounded-md bg-stone-50 px-3 py-1.5 text-sm text-stone-800"
                    >
                      {a.label}
                      <form action={deleteAmenity.bind(null, id, unitId, a.id)}>
                        <button
                          type="submit"
                          className="text-xs font-medium text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <form
            action={addAmenity.bind(null, id, unitId)}
            className="mt-5 flex items-end gap-3 border-t border-stone-200 pt-5"
          >
            <div className="flex-1">
              <label htmlFor="label" className="block text-xs font-medium text-stone-600">
                Name
              </label>
              <input
                id="label"
                name="label"
                type="text"
                required
                placeholder="Dishwasher, Exposed brick, In-unit laundry…"
                className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="category"
                className="block text-xs font-medium text-stone-600"
              >
                Type
              </label>
              <select
                id="category"
                name="category"
                className="mt-1 block rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
              >
                <option value="AMENITY">Amenity</option>
                <option value="APPLIANCE">Appliance</option>
              </select>
            </div>
            <button
              type="submit"
              className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
            >
              Add
            </button>
          </form>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">Utilities</h2>
        <form
          action={setUtilities.bind(null, id, unitId)}
          className="rounded-lg border border-stone-200 bg-white p-6"
        >
          <div className="divide-y divide-stone-100">
            {UTILITY_TYPES.map((type) => {
              const current = utilityByType.has(type)
                ? utilityByType.get(type)
                  ? "INCLUDED"
                  : "TENANT_PAYS"
                : "NA";
              return (
                <div key={type} className="flex items-center justify-between py-3">
                  <span className="text-sm text-stone-800">{UTILITY_LABELS[type]}</span>
                  <select
                    name={`utility_${type}`}
                    defaultValue={current}
                    className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm focus:border-stone-500 focus:outline-none"
                  >
                    <option value="NA">Not applicable</option>
                    <option value="INCLUDED">Included in rent</option>
                    <option value="TENANT_PAYS">Tenant pays</option>
                  </select>
                </div>
              );
            })}
          </div>
          <button
            type="submit"
            className="mt-5 rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
          >
            Save utilities
          </button>
        </form>
      </section>
    </div>
  );
}
