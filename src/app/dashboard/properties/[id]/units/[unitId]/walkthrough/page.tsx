import Link from "next/link";
import { notFound } from "next/navigation";

import { DetailsCard } from "@/components/details-card";
import { FloorPlanManager } from "@/components/floor-plan-manager";
import { RoomsEditor } from "@/components/rooms-editor";
import { prisma } from "@/lib/prisma";
import { requireLandlord } from "@/lib/current-user";
import { SECTIONS } from "@/lib/details/catalog";
import { progress } from "@/lib/details/format";
import type { Details, Room } from "@/lib/details/schema";
import { toPhotoView } from "@/lib/images/view";

export default async function WalkthroughPage({
  params,
}: {
  params: Promise<{ id: string; unitId: string }>;
}) {
  const { id, unitId } = await params;
  const user = await requireLandlord();

  const unit = await prisma.unit.findFirst({
    where: { id: unitId, propertyId: id, property: { landlordId: user.id } },
    include: {
      property: true,
      listing: {
        include: {
          photos: { where: { kind: "FLOOR_PLAN" }, orderBy: { createdAt: "asc" } },
        },
      },
    },
  });
  if (!unit) notFound();

  const details = (unit.details as Details | null) ?? { version: 1 };
  const rooms = (unit.rooms as Room[] | null) ?? [];

  const totals = SECTIONS.map((s) => progress(s, details[s.key])).reduce(
    (sum, p) => ({
      answered: sum.answered + p.answered,
      total: sum.total + p.total,
      open: sum.open + p.open,
    }),
    { answered: 0, total: 0, open: 0 },
  );
  const percent = totals.total ? Math.round((totals.answered / totals.total) * 100) : 0;

  return (
    <div>
      <Link
        href={`/dashboard/properties/${id}`}
        className="text-sm text-stone-500 hover:underline"
      >
        ← Back to {unit.property.name || unit.property.addressLine1}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-[#3D2E24]">House details</h1>
      <p className="mt-1 max-w-2xl text-sm text-stone-600">
        Walk through the house and answer what you know — on your phone if that&apos;s
        easier. Every question is optional. Choose <strong>Not sure</strong> when you
        don&apos;t know: it is never shown to the public, and it stays here as an open
        item. Save each card as you go.
      </p>

      <div className="mt-4 rounded-lg border border-stone-200 bg-white p-4">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium text-stone-700">
            {totals.answered} of {totals.total} questions answered
          </span>
          <span className="text-stone-500">
            {percent}%
            {totals.open > 0 && (
              <span className="text-amber-700"> · {totals.open} open</span>
            )}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded bg-stone-100">
          <div className="h-full bg-[#B1502F]" style={{ width: `${percent}%` }} />
        </div>
        <nav aria-label="Sections" className="mt-3 flex flex-wrap gap-2 text-sm">
          <a
            href="#rooms"
            className="rounded-full border border-stone-300 px-3 py-1 text-stone-700 hover:bg-stone-50"
          >
            Rooms &amp; floor plans
          </a>
          {SECTIONS.map((s) => (
            <a
              key={s.key}
              href={`#${s.key}`}
              className="rounded-full border border-stone-300 px-3 py-1 text-stone-700 hover:bg-stone-50"
            >
              {s.title}
            </a>
          ))}
        </nav>
      </div>

      <div className="mt-6 space-y-6">
        <section
          id="rooms"
          className="scroll-mt-6 rounded-lg border border-stone-200 bg-white p-5"
        >
          <h2 className="text-lg font-semibold text-[#3D2E24]">
            Rooms &amp; floor plans
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Describe the rooms, and upload a plan for each floor — a phone photo of a hand
            sketch is fine. Visitors see it labelled &ldquo;Approximate — not to
            scale.&rdquo; If you wrote letters or numbers on the sketch, enter them as
            each room&apos;s marker.
          </p>
          <h3 className="mt-4 text-sm font-semibold text-stone-700">Floor plans</h3>
          <FloorPlanManager
            listingId={unit.listing?.id ?? null}
            initialPlans={(unit.listing?.photos ?? []).map(toPhotoView)}
          />
          <h3 className="mt-6 text-sm font-semibold text-stone-700">Rooms</h3>
          <div className="mt-3">
            <RoomsEditor propertyId={id} unitId={unitId} initialRooms={rooms} />
          </div>
        </section>

        {SECTIONS.map((section) => (
          <DetailsCard
            key={section.key}
            propertyId={id}
            unitId={unitId}
            section={section}
            initial={details[section.key]}
          />
        ))}
      </div>
    </div>
  );
}
