import Link from "next/link";
import { notFound } from "next/navigation";

import { PrintButton } from "@/components/print-button";
import { ResponsivePicture } from "@/components/responsive-picture";
import {
  dateText,
  EQUAL_HOUSING,
  bedBath,
  leadNotice,
  money,
} from "@/lib/channels/compose";
import { loadKit } from "@/lib/channels/load";
import { requireLandlord } from "@/lib/current-user";

// A one-page flyer for a yard sign, a bulletin board or a coffee shop. Print it,
// or choose "Save as PDF" in the print dialog.
export default async function FlyerPage({
  params,
}: {
  params: Promise<{ id: string; unitId: string }>;
}) {
  const { id, unitId } = await params;
  const user = await requireLandlord();
  const kit = await loadKit(id, unitId, user.id);
  if (!kit) notFound();

  const { facts } = kit;
  const hero =
    kit.photos.find((p) => p.kind === "PHOTO" && p.isHero) ??
    kit.photos.find((p) => p.kind === "PHOTO");
  const notice = leadNotice(facts);
  const contact = [facts.contactEmail, facts.contactPhone].filter(Boolean);

  return (
    <div>
      <style>{`@page { size: letter; margin: 0.5in; }`}</style>

      <div className="print:hidden">
        <Link
          href={`/dashboard/properties/${id}/units/${unitId}/share`}
          className="text-sm text-stone-500 hover:underline"
        >
          ← Back to posting
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-[#3D2E24]">Printable flyer</h1>
        <p className="mt-1 max-w-2xl text-sm text-stone-600">
          Preview of what will print. Use your browser&apos;s print dialog, and choose
          &ldquo;Save as PDF&rdquo; to keep a file. A QR code to the listing page comes
          once the site is online.
        </p>
        <div className="mt-3 mb-6">
          <PrintButton />
        </div>
      </div>

      <article
        aria-label="Flyer"
        className="mx-auto max-w-[8in] rounded-lg border border-stone-300 bg-white p-8 text-stone-900 print:max-w-none print:rounded-none print:border-0 print:p-0"
      >
        <p className="text-sm font-semibold tracking-[0.2em] text-[#9A4635] uppercase">
          For rent
        </p>
        <h2
          className="mt-1 text-4xl leading-tight font-semibold"
          style={{ fontFamily: "var(--font-spectral, Georgia, serif)" }}
        >
          {facts.headline}
        </h2>
        <p className="mt-1 text-lg text-stone-600">
          {[
            facts.address.line1,
            facts.address.city,
            `${facts.address.state} ${facts.address.zip}`,
          ].join(", ")}
        </p>

        {hero && (
          <div className="mt-5 overflow-hidden rounded-lg">
            <ResponsivePicture
              photo={hero}
              alt={hero.altText || hero.caption || facts.headline}
              sizes="8in"
              priority
              className="aspect-[16/10] w-full object-cover"
            />
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-y border-stone-300 py-4">
          <p className="text-4xl font-semibold text-[#9A4635]">
            {facts.rentCents != null ? `${money(facts.rentCents)}` : ""}
            {facts.rentCents != null && (
              <span className="text-lg font-normal text-stone-600"> / month</span>
            )}
          </p>
          <div className="text-right text-lg">
            <p>{bedBath(facts)}</p>
            {facts.dateAvailable && (
              <p className="text-stone-600">Available {dateText(facts.dateAvailable)}</p>
            )}
          </div>
        </div>

        {facts.highlights.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {facts.highlights.slice(0, 8).map((h) => (
              <li
                key={h}
                className="rounded-full border border-[#9A4635]/40 px-3 py-1 text-sm text-[#9A4635]"
              >
                {h}
              </li>
            ))}
          </ul>
        )}

        {(facts.preview || facts.story[0]) && (
          <p className="mt-4 text-lg leading-relaxed">
            {facts.preview ?? facts.story[0]}
          </p>
        )}

        {contact.length > 0 && (
          <div className="mt-6 rounded-lg bg-[#F3E8D8] p-4">
            <p className="text-sm font-semibold tracking-wide text-[#6B4A34] uppercase">
              Showings by appointment
            </p>
            <p className="mt-1 text-2xl font-semibold">{contact.join("   ·   ")}</p>
          </div>
        )}

        <p className="mt-6 text-xs leading-relaxed text-stone-500">
          {notice ? `${notice} ` : ""}
          {EQUAL_HOUSING}
        </p>
      </article>
    </div>
  );
}
