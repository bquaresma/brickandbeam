import { FormWithError, SubmitButton } from "@/components/action-form";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import type { ActionResult } from "@/lib/actions/action-result";

type PropertyFormValues = {
  name?: string | null;
  addressLine1?: string;
  addressLine2?: string | null;
  city?: string;
  state?: string;
  zip?: string;
  alleyAddress?: string | null;
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

      <AddressAutocomplete
        defaultAddressLine1={defaultValues?.addressLine1}
        defaultCity={defaultValues?.city}
        defaultState={defaultValues?.state}
        defaultZip={defaultValues?.zip}
      />

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

      <div>
        <label
          htmlFor="alleyAddress"
          className="block text-sm font-medium text-stone-700"
        >
          Alley / back street (optional)
        </label>
        <input
          id="alleyAddress"
          name="alleyAddress"
          type="text"
          placeholder="Rear address or nearest cross street, e.g. 'Onyx Way behind the property'"
          defaultValue={defaultValues?.alleyAddress ?? ""}
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-[#B1502F] focus:outline-none"
        />
        <p className="mt-1 text-xs text-stone-500">
          If this property backs onto an alley or service street, adding it here adds a
          second Street View link on the public listing.
        </p>
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
