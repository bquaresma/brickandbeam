"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireLandlord } from "@/lib/current-user";
import { SECTION_KEYS, type SectionKey } from "@/lib/details/catalog";
import { parseFacts, parseRooms, parseSection } from "@/lib/details/schema";
import { toRecord, visibleQuestions } from "@/lib/questions";
import type { ActionResult } from "@/lib/actions/action-result";

// Ownership: unit -> property -> landlord.
async function findOwnedUnit(propertyId: string, unitId: string, landlordId: string) {
  return prisma.unit.findFirst({
    where: { id: unitId, propertyId, property: { landlordId } },
    select: { id: true },
  });
}

function refresh(propertyId: string, unitId: string) {
  revalidatePath(`/dashboard/properties/${propertyId}/units/${unitId}/walkthrough`);
  revalidatePath("/listings/[listingId]", "page");
}

// Saves one card of the walk-through. The merge happens inside Postgres
// (jsonb_set), so two cards saved at nearly the same moment can't overwrite
// each other the way a read-modify-write would.
export async function saveDetailsSection(
  propertyId: string,
  unitId: string,
  section: string,
  input: unknown,
): Promise<ActionResult> {
  const user = await requireLandlord();
  if (!(await findOwnedUnit(propertyId, unitId, user.id)))
    return { error: "Unit not found." };
  if (!(SECTION_KEYS as readonly string[]).includes(section))
    return { error: "Unknown section." };

  const questions = (await visibleQuestions(user.id)).map(toRecord);
  const parsed = parseSection(section as SectionKey, input, questions);
  if (!parsed.ok) return { error: parsed.error };

  await prisma.$executeRaw`
    UPDATE units
    SET details = jsonb_set(
          jsonb_set(COALESCE(details, '{}'::jsonb), '{version}', '1'::jsonb),
          ARRAY[${section}]::text[],
          ${JSON.stringify(parsed.value)}::jsonb,
          true
        ),
        "updatedAt" = now()
    WHERE id = ${unitId}`;

  refresh(propertyId, unitId);
}

export async function saveRooms(
  propertyId: string,
  unitId: string,
  input: unknown,
): Promise<ActionResult> {
  const user = await requireLandlord();
  if (!(await findOwnedUnit(propertyId, unitId, user.id)))
    return { error: "Unit not found." };

  const questions = (await visibleQuestions(user.id)).map(toRecord);
  const parsed = parseRooms(input, questions);
  if (!parsed.ok) return { error: parsed.error };

  await prisma.unit.update({ where: { id: unitId }, data: { rooms: parsed.value } });
  refresh(propertyId, unitId);
}

export async function saveFacts(
  propertyId: string,
  unitId: string,
  input: unknown,
): Promise<ActionResult> {
  const user = await requireLandlord();
  if (!(await findOwnedUnit(propertyId, unitId, user.id)))
    return { error: "Unit not found." };

  const parsed = parseFacts(input);
  if (!parsed.ok) return { error: parsed.error };

  await prisma.$executeRaw`
    UPDATE units
    SET details = jsonb_set(
          jsonb_set(COALESCE(details, '{}'::jsonb), '{version}', '1'::jsonb),
          '{facts}',
          ${JSON.stringify(parsed.value)}::jsonb,
          true
        ),
        "updatedAt" = now()
    WHERE id = ${unitId}`;

  refresh(propertyId, unitId);
}
