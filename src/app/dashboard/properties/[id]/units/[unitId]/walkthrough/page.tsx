import Link from "next/link";
import { notFound } from "next/navigation";

import { CustomDetailsCard } from "@/components/custom-details-card";
import { DetailsCard } from "@/components/details-card";
import { FloorPlanManager } from "@/components/floor-plan-manager";
import { RoomsEditor } from "@/components/rooms-editor";
import { WalkthroughShell, type Step } from "@/components/walkthrough-shell";
import { prisma } from "@/lib/prisma";
import { requireLandlord } from "@/lib/current-user";
import { ROOM_FIELDS, SECTIONS, type SectionKey } from "@/lib/details/catalog";
import { roomQuestionFields, withCustomFields } from "@/lib/details/custom";
import { progress } from "@/lib/details/format";
import type { Details, Room } from "@/lib/details/schema";
import { toPhotoView } from "@/lib/images/view";
import { toRecord, visibleQuestions, type QuestionView } from "@/lib/questions";

// The order you'd walk the house: the layout first, then outside, in through
// the kitchen and baths, down to the basement, then what's behind the walls.
const WALK_ORDER: (SectionKey | "rooms" | "custom")[] = [
  "rooms",
  "outdoors",
  "kitchen",
  "bathrooms",
  "laundry",
  "basement",
  "systems",
  "energy",
  "tech",
  "upkeep",
  "character",
  "knownConditions",
  "general",
  "custom",
];

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

  // The landlord's own questions plus approved ones extend the built-in cards.
  const questionRows = await visibleQuestions(user.id);
  const records = questionRows.map(toRecord);
  const sections = SECTIONS.map((s) => withCustomFields(s, records)).filter(
    (s) => s.fields.length > 0,
  );
  const roomFields = [...ROOM_FIELDS, ...roomQuestionFields(records)];
  const questionViews: QuestionView[] = questionRows.map((q) => ({
    ...toRecord(q),
    id: q.id,
    mine: q.authorId === user.id,
    status: q.status,
    submitNote: q.submitNote,
    reviewNote: q.reviewNote,
  }));

  const steps: Step[] = [];
  for (const key of WALK_ORDER) {
    if (key === "rooms") {
      steps.push({
        key,
        title: "Rooms & floor plans",
        progress: { answered: rooms.length > 0 ? 1 : 0, total: 1, open: 0 },
        node: (
          <section
            id="rooms"
            aria-labelledby="rooms-title"
            className="rounded-lg border border-stone-200 bg-white p-5"
          >
            <h2 id="rooms-title" className="text-lg font-semibold text-[#3D2E24]">
              Rooms &amp; floor plans
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Describe the rooms, and upload a plan for each floor — a phone photo of a
              hand sketch is fine. Visitors see it labelled &ldquo;Approximate — not to
              scale.&rdquo; If you wrote letters or numbers on the sketch, enter them as
              each room&apos;s marker. Your bathrooms and basement, described in their own
              steps, appear on the floor-by-floor view automatically.
            </p>
            <h3 className="mt-4 text-sm font-semibold text-stone-700">Floor plans</h3>
            <FloorPlanManager
              listingId={unit.listing?.id ?? null}
              initialPlans={(unit.listing?.photos ?? []).map(toPhotoView)}
            />
            <h3 className="mt-6 text-sm font-semibold text-stone-700">Rooms</h3>
            <div className="mt-3">
              <RoomsEditor
                propertyId={id}
                unitId={unitId}
                initialRooms={rooms}
                fields={roomFields}
              />
            </div>
          </section>
        ),
      });
    } else if (key === "custom") {
      steps.push({
        key,
        title: "Your own questions",
        node: (
          <CustomDetailsCard
            propertyId={id}
            unitId={unitId}
            initialFacts={details.facts ?? []}
            questions={questionViews}
          />
        ),
      });
    } else {
      const section = sections.find((s) => s.key === key);
      if (!section) continue;
      steps.push({
        key,
        title: section.title,
        progress: progress(section, details[key]),
        node: (
          <DetailsCard
            propertyId={id}
            unitId={unitId}
            section={section}
            initial={details[key]}
          />
        ),
      });
    }
  }

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
        easier. Every question is optional, and your answers save as you go. Choose{" "}
        <strong>Not sure</strong> when you don&apos;t know: it is never shown to the
        public, and it stays here as an open item.
      </p>

      <WalkthroughShell
        steps={steps}
        propertyHref={`/dashboard/properties/${id}`}
        previewHref={unit.listing ? `/listings/${unit.listing.id}` : null}
      />
    </div>
  );
}
