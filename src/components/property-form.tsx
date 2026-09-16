import { FormWithError, SubmitButton } from "@/components/action-form";
import type { ActionResult } from "@/lib/actions/action-result";

type PropertyFormValues = {
  name?: string | null;
  addressLine1?: string;
  addressLine2?: string | null;
  city?: string;
  state?: string;
  zip?: string;
  buildYear?: number;
  neighborhoodBlurb?: string | null;
};

export function PropertyForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  defaultValues?: PropertyFormValues;
  submitLabel: string;
}) {
  return (
    <FormWithError
      action={action}
      className="space-y-4 rounded-lg border border-stone-200 bg-white p-6"
    >
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-stone-700">
          Nickname (optional)
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={defaultValues?.name ?? ""}
          placeholder="The Lawrenceville rowhouse"
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-[#B1502F] focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="addressLine1"
          className="block text-sm font-medium text-stone-700"
        >
          Address line 1
        </label>
        <input
          id="addressLine1"
          name="addressLine1"
          type="text"
          required
          defaultValue={defaultValues?.addressLine1 ?? ""}
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-[#B1502F] focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="addressLine2"
          className="block text-sm font-medium text-stone-700"
        >
          Address line 2 (optional)
        </label>
        <input
          id="addressLine2"
          name="addressLine2"
          type="text"
          defaultValue={defaultValues?.addressLine2 ?? ""}
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-[#B1502F] focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1">
          <label htmlFor="city" className="block text-sm font-medium text-stone-700">
            City
          </label>
          <input
            id="city"
            name="city"
            type="text"
            required
            defaultValue={defaultValues?.city ?? ""}
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-[#B1502F] focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-stone-700">
            State
          </label>
          <input
            id="state"
            name="state"
            type="text"
            required
            maxLength={2}
            defaultValue={defaultValues?.state ?? ""}
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm uppercase focus:border-[#B1502F] focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="zip" className="block text-sm font-medium text-stone-700">
            Zip
          </label>
          <input
            id="zip"
            name="zip"
            type="text"
            required
            defaultValue={defaultValues?.zip ?? ""}
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-[#B1502F] focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label htmlFor="buildYear" className="block text-sm font-medium text-stone-700">
          Build year
        </label>
        <input
          id="buildYear"
          name="buildYear"
          type="number"
          required
          min={1600}
          max={new Date().getFullYear()}
          defaultValue={defaultValues?.buildYear ?? ""}
          className="mt-1 block w-40 rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-[#B1502F] focus:outline-none"
        />
        <p className="mt-1 text-xs text-stone-500">
          Properties built before 1978 trigger the federal lead-paint disclosure
          requirement.
        </p>
      </div>

      <div>
        <label
          htmlFor="neighborhoodBlurb"
          className="block text-sm font-medium text-stone-700"
        >
          Neighborhood blurb (optional)
        </label>
        <textarea
          id="neighborhoodBlurb"
          name="neighborhoodBlurb"
          rows={4}
          placeholder="A short paragraph on the neighborhood and walkability — shown on every listing at this address."
          defaultValue={defaultValues?.neighborhoodBlurb ?? ""}
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-[#B1502F] focus:outline-none"
        />
        <p className="mt-1 text-xs text-stone-500">
          Shared across every unit&apos;s listing at this property.
        </p>
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
