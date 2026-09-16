import { notFound } from "next/navigation";
import { FeeType, FeeTiming, PetType, UtilityType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireLandlord } from "@/lib/current-user";
import {
  addAmenity,
  deleteAmenity,
  setUtilities,
  addPetPolicy,
  deletePetPolicy,
  addFee,
  deleteFee,
} from "@/lib/actions/unit-details";
import { FormWithError, SubmitButton } from "@/components/action-form";

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

const PET_TYPE_LABELS: Record<PetType, string> = {
  DOGS: "Dogs",
  CATS: "Cats",
  BIRDS: "Birds",
  REPTILES: "Reptiles",
  FISH: "Fish",
  OTHER: "Other",
};

const FEE_TYPE_LABELS: Record<FeeType, string> = {
  SECURITY_DEPOSIT: "Security deposit",
  APPLICATION_FEE: "Application fee",
  PET_RENT: "Pet rent",
  PET_DEPOSIT: "Pet deposit",
  PET_FEE: "Pet fee",
  PARKING_FEE: "Parking fee",
  PARKING_PERMIT: "Parking permit",
  STORAGE_FEE: "Storage fee",
  SEWER_FEE: "Sewer fee",
  GARBAGE_FEE: "Garbage fee",
  OTHER: "Other",
};

const FEE_TIMING_LABELS: Record<FeeTiming, string> = {
  MOVE_IN: "At move-in",
  AT_APPLICATION: "At application",
  MONTHLY: "Monthly",
  ONE_TIME_OTHER: "One-time",
  RECURRING_OTHER: "Recurring",
};

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
      petPolicies: { orderBy: { createdAt: "asc" } },
      fees: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!unit) notFound();

  const appliances = unit.amenities.filter((a) => a.category === "APPLIANCE");
  const amenities = unit.amenities.filter((a) => a.category === "AMENITY");
  const utilityByType = new Map(unit.utilities.map((u) => [u.type, u.included]));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-[#3D2E24]">
          Amenities &amp; utilities for {unit.name}
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          These show up on the unit&apos;s public listing page once it&apos;s published.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[#3D2E24]">
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

          <FormWithError
            action={addAmenity.bind(null, id, unitId)}
            className="mt-5 flex flex-wrap items-end gap-3 border-t border-stone-200 pt-5"
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
                className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-[#B1502F] focus:outline-none"
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
                className="mt-1 block rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-[#B1502F] focus:outline-none"
              >
                <option value="AMENITY">Amenity</option>
                <option value="APPLIANCE">Appliance</option>
              </select>
            </div>
            <SubmitButton
              pendingLabel="Adding…"
              className="rounded-md bg-[#B1502F] px-4 py-2 text-sm font-medium text-white hover:bg-[#8F3F25] disabled:opacity-50"
            >
              Add
            </SubmitButton>
          </FormWithError>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[#3D2E24]">Utilities</h2>
        <FormWithError
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
                    className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm focus:border-[#B1502F] focus:outline-none"
                  >
                    <option value="NA">Not applicable</option>
                    <option value="INCLUDED">Included in rent</option>
                    <option value="TENANT_PAYS">Tenant pays</option>
                  </select>
                </div>
              );
            })}
          </div>
          <SubmitButton
            pendingLabel="Saving…"
            className="mt-5 rounded-md bg-[#B1502F] px-4 py-2 text-sm font-medium text-white hover:bg-[#8F3F25] disabled:opacity-50"
          >
            Save utilities
          </SubmitButton>
        </FormWithError>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[#3D2E24]">Pet policy</h2>
        <div className="rounded-lg border border-stone-200 bg-white p-6">
          {unit.petPolicies.length === 0 ? (
            <p className="text-sm text-stone-400">No pet policy added yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {unit.petPolicies.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-md bg-stone-50 px-3 py-1.5 text-sm text-stone-800"
                >
                  <span>
                    {PET_TYPE_LABELS[p.petType]}
                    {p.petSize
                      ? ` (${p.petSize === "SMALL" ? "small" : "large"})`
                      : ""} —{" "}
                    <span className={p.allowed ? "text-green-700" : "text-red-700"}>
                      {p.allowed ? "Allowed" : "Not allowed"}
                    </span>
                  </span>
                  <form action={deletePetPolicy.bind(null, id, unitId, p.id)}>
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

          <FormWithError
            action={addPetPolicy.bind(null, id, unitId)}
            className="mt-5 flex flex-wrap items-end gap-3 border-t border-stone-200 pt-5"
          >
            <div>
              <label
                htmlFor="petType"
                className="block text-xs font-medium text-stone-600"
              >
                Pet type
              </label>
              <select
                id="petType"
                name="petType"
                className="mt-1 block rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-[#B1502F] focus:outline-none"
              >
                {Object.values(PetType).map((t) => (
                  <option key={t} value={t}>
                    {PET_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="petSize"
                className="block text-xs font-medium text-stone-600"
              >
                Size
              </label>
              <select
                id="petSize"
                name="petSize"
                className="mt-1 block rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-[#B1502F] focus:outline-none"
              >
                <option value="">Any</option>
                <option value="SMALL">Small</option>
                <option value="LARGE">Large</option>
              </select>
            </div>
            <label className="flex items-center gap-2 pb-2.5 text-sm text-stone-700">
              <input
                type="checkbox"
                name="allowed"
                defaultChecked
                className="rounded border-stone-300"
              />
              Allowed
            </label>
            <SubmitButton
              pendingLabel="Adding…"
              className="rounded-md bg-[#B1502F] px-4 py-2 text-sm font-medium text-white hover:bg-[#8F3F25] disabled:opacity-50"
            >
              Add
            </SubmitButton>
          </FormWithError>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[#3D2E24]">Costs &amp; fees</h2>
        <div className="rounded-lg border border-stone-200 bg-white p-6">
          {unit.fees.length === 0 ? (
            <p className="text-sm text-stone-400">No fees added yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {unit.fees.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between rounded-md bg-stone-50 px-3 py-1.5 text-sm text-stone-800"
                >
                  <span>
                    {FEE_TYPE_LABELS[f.type]}
                    {f.amountCents != null
                      ? ` — $${(f.amountCents / 100).toLocaleString()}`
                      : ""}{" "}
                    <span className="text-stone-500">
                      ({FEE_TIMING_LABELS[f.timing]}
                      {f.requirement === "OPTIONAL" ? ", optional" : ""})
                    </span>
                    {f.description ? ` — ${f.description}` : ""}
                  </span>
                  <form action={deleteFee.bind(null, id, unitId, f.id)}>
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

          <FormWithError
            action={addFee.bind(null, id, unitId)}
            className="mt-5 flex flex-wrap items-end gap-3 border-t border-stone-200 pt-5"
          >
            <div>
              <label htmlFor="type" className="block text-xs font-medium text-stone-600">
                Fee type
              </label>
              <select
                id="type"
                name="type"
                className="mt-1 block rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-[#B1502F] focus:outline-none"
              >
                {Object.values(FeeType).map((t) => (
                  <option key={t} value={t}>
                    {FEE_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="amountDollars"
                className="block text-xs font-medium text-stone-600"
              >
                Amount ($)
              </label>
              <input
                id="amountDollars"
                name="amountDollars"
                type="number"
                min={0}
                step="0.01"
                className="mt-1 block w-28 rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-[#B1502F] focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="timing"
                className="block text-xs font-medium text-stone-600"
              >
                When
              </label>
              <select
                id="timing"
                name="timing"
                className="mt-1 block rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-[#B1502F] focus:outline-none"
              >
                {Object.values(FeeTiming).map((t) => (
                  <option key={t} value={t}>
                    {FEE_TIMING_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="requirement"
                className="block text-xs font-medium text-stone-600"
              >
                Requirement
              </label>
              <select
                id="requirement"
                name="requirement"
                className="mt-1 block rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-[#B1502F] focus:outline-none"
              >
                <option value="MANDATORY">Mandatory</option>
                <option value="OPTIONAL">Optional</option>
                <option value="SITUATIONAL">Situational</option>
              </select>
            </div>
            <div className="flex-1">
              <label
                htmlFor="description"
                className="block text-xs font-medium text-stone-600"
              >
                Note (optional)
              </label>
              <input
                id="description"
                name="description"
                type="text"
                placeholder="Refundable, per pet, etc."
                className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-[#B1502F] focus:outline-none"
              />
            </div>
            <SubmitButton
              pendingLabel="Adding…"
              className="rounded-md bg-[#B1502F] px-4 py-2 text-sm font-medium text-white hover:bg-[#8F3F25] disabled:opacity-50"
            >
              Add
            </SubmitButton>
          </FormWithError>
        </div>
      </section>
    </div>
  );
}
