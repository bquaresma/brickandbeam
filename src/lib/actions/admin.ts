"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/current-user";
import type { ActionResult } from "@/lib/actions/action-result";

function refresh() {
  revalidatePath("/dashboard", "layout");
  revalidatePath("/listings/[listingId]", "page");
}

// Approving makes the question appear in every landlord's walk-through at
// once. The reviewer may tidy the wording first.
export async function approveQuestion(
  id: string,
  edits: { label?: string; help?: string },
): Promise<ActionResult> {
  await requireAdmin();
  const question = await prisma.customQuestion.findUnique({ where: { id } });
  if (!question || question.status !== "SUBMITTED")
    return { error: "That suggestion is no longer pending." };

  const label = (edits.label ?? question.label).trim();
  if (label.length < 3 || label.length > 120)
    return { error: "The label must be 3–120 characters." };
  const help = (edits.help ?? question.help ?? "").trim();
  if (help.length > 200) return { error: "Help text must be 200 characters or fewer." };

  await prisma.customQuestion.update({
    where: { id },
    data: {
      status: "APPROVED",
      label,
      help: help || null,
      reviewedAt: new Date(),
      reviewNote: null,
    },
  });
  refresh();
}

// Rejecting keeps the question working for its author; it just isn't shared.
export async function rejectQuestion(id: string, note: string): Promise<ActionResult> {
  await requireAdmin();
  const question = await prisma.customQuestion.findUnique({ where: { id } });
  if (!question || question.status !== "SUBMITTED")
    return { error: "That suggestion is no longer pending." };
  const reason = note.trim();
  if (!reason)
    return {
      error:
        "Say why, so the author understands (for example, “already covered by Systems”).",
    };

  await prisma.customQuestion.update({
    where: { id },
    data: {
      status: "REJECTED",
      reviewNote: reason.slice(0, 400),
      reviewedAt: new Date(),
    },
  });
  refresh();
}
