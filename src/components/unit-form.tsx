type UnitFormValues = {
  name?: string;
  rentAmountCents?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  squareFeet?: number | null;
  layoutNotes?: string | null;
};

export function UnitForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaultValues?: UnitFormValues;
  submitLabel: string;
}) {
  const rentDollars =
    defaultValues?.rentAmountCents != null ? defaultValues.rentAmountCents / 100 : "";

  return (
    <form
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
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
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
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
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
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
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
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
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
          className="mt-1 block w-40 rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
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
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-stone-500">
          Use this for anything that doesn&apos;t fit a standard bed/bath grid.
        </p>
      </div>

      <button
        type="submit"
        className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
      >
        {submitLabel}
      </button>
    </form>
  );
}
