import { FormWithError, SubmitButton } from "@/components/action-form";
import type { ActionResult } from "@/lib/actions/action-result";

type UnitFormValues = {
  name?: string;
  rentAmountCents?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  squareFeet?: number | null;
  layoutNotes?: string | null;
  dateAvailable?: Date | null;
  isFurnished?: boolean | null;
  smokingAllowed?: boolean | null;
  parkingType?: string | null;
};

const PARKING_TYPE_OPTIONS = [
  { value: "", label: "Not specified" },
  { value: "GARAGE_ATTACHED", label: "Attached garage" },
  { value: "GARAGE_LOT", label: "Garage lot" },
  { value: "COVERED_LOT", label: "Covered lot" },
  { value: "STREET", label: "Street" },
  { value: "SURFACE_LOT", label: "Surface lot" },
  { value: "OTHER", label: "Other" },
  { value: "NONE", label: "None" },
];

export function UnitForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  defaultValues?: UnitFormValues;
  submitLabel: string;
}) {
  const rentDollars =
    defaultValues?.rentAmountCents != null ? defaultValues.rentAmountCents / 100 : "";
  const dateAvailable = defaultValues?.dateAvailable
    ? new Date(defaultValues.dateAvailable).toISOString().slice(0, 10)
    : "";

  return (
    <FormWithError
      action={action}
      className="space-y-4 rounded-lg border border-stone-200 bg-white p-6"
    >
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-stone-700">
          Unit name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="Carriage House, Attic Suite, Unit A…"
          defaultValue={defaultValues?.name ?? ""}
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-[#B1502F] focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label
            htmlFor="rentDollars"
            className="block text-sm font-medium text-stone-700"
          >
            Rent ($/mo)
          </label>
          <input
            id="rentDollars"
            name="rentDollars"
            type="number"
            min={0}
            step="0.01"
            defaultValue={rentDollars}
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-[#B1502F] focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="bedrooms" className="block text-sm font-medium text-stone-700">
            Bedrooms
          </label>
          <input
            id="bedrooms"
            name="bedrooms"
            type="number"
            min={0}
            step="0.5"
            defaultValue={defaultValues?.bedrooms ?? ""}
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-[#B1502F] focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="bathrooms" className="block text-sm font-medium text-stone-700">
            Bathrooms
          </label>
          <input
            id="bathrooms"
            name="bathrooms"
            type="number"
            min={0}
            step="0.5"
            defaultValue={defaultValues?.bathrooms ?? ""}
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-[#B1502F] focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label htmlFor="squareFeet" className="block text-sm font-medium text-stone-700">
          Square feet
        </label>
        <input
          id="squareFeet"
          name="squareFeet"
          type="number"
          min={0}
          defaultValue={defaultValues?.squareFeet ?? ""}
          className="mt-1 block w-40 rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-[#B1502F] focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="layoutNotes" className="block text-sm font-medium text-stone-700">
          Layout notes
        </label>
        <textarea
          id="layoutNotes"
          name="layoutNotes"
          rows={3}
          placeholder="Converted attic with a non-conforming bedroom, exposed brick in the living area…"
          defaultValue={defaultValues?.layoutNotes ?? ""}
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-[#B1502F] focus:outline-none"
        />
        <p className="mt-1 text-xs text-stone-500">
          Use this for anything that doesn&apos;t fit a standard bed/bath grid.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="dateAvailable"
            className="block text-sm font-medium text-stone-700"
          >
            Available on
          </label>
          <input
            id="dateAvailable"
            name="dateAvailable"
            type="date"
            defaultValue={dateAvailable}
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-[#B1502F] focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="parkingType"
            className="block text-sm font-medium text-stone-700"
          >
            Parking
          </label>
          <select
            id="parkingType"
            name="parkingType"
            defaultValue={defaultValues?.parkingType ?? ""}
            className="mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-[#B1502F] focus:outline-none"
          >
            {PARKING_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            name="isFurnished"
            defaultChecked={defaultValues?.isFurnished ?? false}
            className="rounded border-stone-300"
          />
          Furnished
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            name="smokingAllowed"
            defaultChecked={defaultValues?.smokingAllowed ?? false}
            className="rounded border-stone-300"
          />
          Smoking allowed
        </label>
      </div>

      <SubmitButton
        pendingLabel="Saving…"
        className="rounded-md bg-[#B1502F] px-4 py-2 text-sm font-medium text-white hover:bg-[#8F3F25] disabled:opacity-50"
      >
        {submitLabel}
      </SubmitButton>
    </FormWithError>
  );
}
