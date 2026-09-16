type ListingFormValues = {
  headline?: string | null;
  previewMessage?: string | null;
  story?: string;
  leaseTerm?: string | null;
  virtualTourUrl?: string | null;
  heroPhotoUrl?: string | null;
  floorPlanUrl?: string | null;
  status?: string;
};

export function ListingForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaultValues?: ListingFormValues;
  submitLabel: string;
}) {
  return (
    <form
      action={action}
      className="space-y-4 rounded-lg border border-stone-200 bg-white p-6"
    >
      <div>
        <label htmlFor="headline" className="block text-sm font-medium text-stone-700">
          Headline (optional)
        </label>
        <input
          id="headline"
          name="headline"
          type="text"
          placeholder="A sun-filled attic retreat above a Lawrenceville rowhouse"
          defaultValue={defaultValues?.headline ?? ""}
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-[#B1502F] focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="previewMessage"
          className="block text-sm font-medium text-stone-700"
        >
          Preview message (optional)
        </label>
        <input
          id="previewMessage"
          name="previewMessage"
          type="text"
          maxLength={255}
          placeholder="A short teaser shown in search results — separate from the full story below"
          defaultValue={defaultValues?.previewMessage ?? ""}
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-[#B1502F] focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="story" className="block text-sm font-medium text-stone-700">
          Story
        </label>
        <textarea
          id="story"
          name="story"
          required
          rows={8}
          placeholder="Tell renters what makes this place different — the character details a bed/bath grid can't capture."
          defaultValue={defaultValues?.story ?? ""}
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-[#B1502F] focus:outline-none"
        />
        <p className="mt-1 text-xs text-stone-500">
          This narrative is the centerpiece of the listing — not an afterthought below a
          spec grid.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="leaseTerm" className="block text-sm font-medium text-stone-700">
            Lease term (optional)
          </label>
          <input
            id="leaseTerm"
            name="leaseTerm"
            type="text"
            placeholder="12 Months, Month-to-month…"
            defaultValue={defaultValues?.leaseTerm ?? ""}
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-[#B1502F] focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="virtualTourUrl"
            className="block text-sm font-medium text-stone-700"
          >
            Virtual tour URL (optional)
          </label>
          <input
            id="virtualTourUrl"
            name="virtualTourUrl"
            type="url"
            placeholder="https://…"
            defaultValue={defaultValues?.virtualTourUrl ?? ""}
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-[#B1502F] focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="heroPhotoUrl"
            className="block text-sm font-medium text-stone-700"
          >
            Hero photo URL (optional)
          </label>
          <input
            id="heroPhotoUrl"
            name="heroPhotoUrl"
            type="url"
            placeholder="https://…"
            defaultValue={defaultValues?.heroPhotoUrl ?? ""}
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-[#B1502F] focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="floorPlanUrl"
            className="block text-sm font-medium text-stone-700"
          >
            Floor plan URL (optional)
          </label>
          <input
            id="floorPlanUrl"
            name="floorPlanUrl"
            type="url"
            placeholder="https://…"
            defaultValue={defaultValues?.floorPlanUrl ?? ""}
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-[#B1502F] focus:outline-none"
          />
        </div>
      </div>
      <p className="-mt-2 text-xs text-stone-500">
        Plain image URLs for now — file upload comes with real photo storage later.
      </p>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-stone-700">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={defaultValues?.status ?? "DRAFT"}
          className="mt-1 block w-48 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-[#B1502F] focus:outline-none"
        >
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <p className="mt-1 text-xs text-stone-500">
          Published listings are visible on their public page; draft and archived listings
          return a 404 to anyone but you.
        </p>
      </div>

      <button
        type="submit"
        className="rounded-md bg-[#B1502F] px-4 py-2 text-sm font-medium text-white hover:bg-[#8F3F25]"
      >
        {submitLabel}
      </button>
    </form>
  );
}
