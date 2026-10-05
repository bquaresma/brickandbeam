import Link from "next/link";
import { notFound } from "next/navigation";

import { ChannelCards } from "@/components/channel-cards";
import { loadKit } from "@/lib/channels/load";
import { requireLandlord } from "@/lib/current-user";
import { zipEntries } from "@/lib/channels/photos";

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string; unitId: string }>;
}) {
  const { id, unitId } = await params;
  const user = await requireLandlord();
  const kit = await loadKit(id, unitId, user.id);
  if (!kit) notFound();

  const photoCount = zipEntries(kit.kitPhotos).length;
  const isDraft = kit.listing.status !== "PUBLISHED";

  return (
    <div>
      <Link
        href={`/dashboard/properties/${id}`}
        className="text-sm text-stone-500 hover:underline"
      >
        ← Back to {kit.property.name || kit.property.addressLine1}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-[#3D2E24]">Post this listing</h1>
      <p className="mt-1 max-w-2xl text-sm text-stone-600">
        Ready-to-paste ads for each site, written from your listing. You post them
        yourself — the sites don&apos;t allow automated posting for individual landlords.
        Each ad ends with the lead-paint notice (for a house built before 1978) and the
        Equal Housing line.
      </p>

      {isDraft && (
        <p className="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
          This listing is still a draft. The ads below use what you&apos;ve saved so far.
        </p>
      )}

      {kit.missing.length > 0 && (
        <div className="mt-4 rounded-lg border border-stone-200 bg-white p-4 text-sm">
          <p className="font-medium text-stone-800">The ads will read better with:</p>
          <ul className="mt-1 list-disc pl-5 text-stone-600">
            {kit.missing.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      <section
        aria-labelledby="fh-title"
        className="mt-4 rounded-lg border border-stone-200 bg-white p-4 text-sm"
      >
        <h2 id="fh-title" className="font-medium text-stone-800">
          Wording check
        </h2>
        {kit.findings.length === 0 ? (
          <p className="mt-1 text-stone-600">
            No flagged phrases found in your headline, story or the features pulled into
            the ads.
          </p>
        ) : (
          <ul className="mt-2 space-y-3">
            {kit.findings.map((f) => (
              <li
                key={`${f.id}-${f.where}-${f.phrase}`}
                className="rounded-md bg-amber-50 p-3"
              >
                <p className="text-amber-900">
                  <span className="font-medium">“{f.phrase}”</span> in {f.where} —{" "}
                  {f.message}
                </p>
                <p className="mt-0.5 text-stone-700">{f.suggestion}</p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-stone-500">
          Advisory only, and it never blocks you. It looks for phrases that describe who
          should live somewhere instead of the home. It is not legal advice, and a clean
          result doesn&apos;t make an ad compliant. If you&apos;re unsure, ask your
          attorney.
        </p>
      </section>

      <section
        aria-labelledby="photos-title"
        className="mt-4 rounded-lg border border-stone-200 bg-white p-4"
      >
        <h2 id="photos-title" className="text-lg font-semibold text-[#3D2E24]">
          Photos and flyer
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          {photoCount > 0
            ? `${photoCount} ${photoCount === 1 ? "file" : "files"}, sized for the listing sites (2048 px, no location data), numbered so the first ones are your best. Floor plans come last.`
            : "Add photos on the listing edit page and they'll appear here as a numbered download."}
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          {photoCount > 0 && (
            <a
              href={`/api/listings/${kit.listing.id}/photos.zip`}
              className="rounded-md bg-[#B1502F] px-4 py-2 text-sm font-medium text-white hover:bg-[#8F3F25]"
            >
              Download all photos (zip)
            </a>
          )}
          <Link
            href={`/dashboard/properties/${id}/units/${unitId}/flyer`}
            className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Make a printable flyer
          </Link>
        </div>
      </section>

      <div className="mt-6">
        <ChannelCards kits={kit.kits} />
      </div>
    </div>
  );
}
