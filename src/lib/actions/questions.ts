"use server";

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireLandlord } from "@/lib/current-user";
import { parseQuestionDefinition } from "@/lib/details/custom";
import type { ActionResult } from "@/lib/actions/action-result";

const MAX_QUESTIONS_PER_LANDLORD = 25;

function refresh() {
  revalidatePath("/dashboard", "layout");
  revalidatePath("/listings/[listingId]", "page");
}

async function ownQuestion(id: string, authorId: string) {
  return prisma.customQuestion.findFirst({ where: { id, authorId } });
}

export type QuestionInput = {
  label: string;
  help?: string;
  type: string;
  optionsText?: string;
  unit?: string;
  section: string;
};

// A new question works for its author straight away; it stays private until
// they choose to suggest it for everyone.
export async function createQuestion(input: QuestionInput): Promise<ActionResult> {
  const user = await requireLandlord();
  const parsed = parseQuestionDefinition(input);
  if (!parsed.ok) return { error: parsed.error };

  const count = await prisma.customQuestion.count({ where: { authorId: user.id } });
  if (count >= MAX_QUESTIONS_PER_LANDLORD) {
    return {
      error: `You can add up to ${MAX_QUESTIONS_PER_LANDLORD} of your own questions.`,
    };
  }

  const d = parsed.value;
  await prisma.customQuestion.create({
    data: {
      authorId: user.id,
      // Never reused, so a stored answer always means the same question.
      key: `x_${randomBytes(5).toString("hex")}`,
      label: d.label,
      help: d.help,
      type: d.type,
      options: d.options ?? undefined,
      unit: d.unit,
      section: d.section,
    },
  });
  refresh();
}

// Wording and choices can change while the question is only the author's.
// Its type and placement stay fixed so stored answers keep their meaning.
export async function updateQuestion(
  id: string,
  input: QuestionInput,
): Promise<ActionResult> {
  const user = await requireLandlord();
  const question = await ownQuestion(id, user.id);
  if (!question) return { error: "Question not found." };
  if (question.status === "SUBMITTED" || question.status === "APPROVED") {
    return {
      error:
        "Withdraw the suggestion before editing — approved questions can't be changed.",
    };
  }

  const parsed = parseQuestionDefinition({
    ...input,
    type: question.type,
    section: question.section,
  });
  if (!parsed.ok) return { error: parsed.error };

  await prisma.customQuestion.update({
    where: { id },
    data: {
      label: parsed.value.label,
      help: parsed.value.help,
      options: parsed.value.options ?? undefined,
      unit: parsed.value.unit,
    },
  });
  refresh();
}

export async function deleteQuestion(id: string): Promise<ActionResult> {
  const user = await requireLandlord();
  const question = await ownQuestion(id, user.id);
  if (!question) return { error: "Question not found." };
  if (question.status === "APPROVED") {
    return {
      error: "Approved questions are shared with other landlords and can't be deleted.",
    };
  }
  if (question.status === "SUBMITTED") return { error: "Withdraw the suggestion first." };

  // Answers already saved under its key are left in place; they no longer
  // display and are dropped the next time that card is saved.
  await prisma.customQuestion.delete({ where: { id } });
  refresh();
}

export async function suggestQuestion(id: string, note: string): Promise<ActionResult> {
  const user = await requireLandlord();
  const question = await ownQuestion(id, user.id);
  if (!question) return { error: "Question not found." };
  if (question.status !== "PRIVATE" && question.status !== "REJECTED") {
    return { error: "This question has already been suggested." };
  }
  await prisma.customQuestion.update({
    where: { id },
    data: {
      status: "SUBMITTED",
      submitNote: note.trim().slice(0, 400) || null,
      submittedAt: new Date(),
      reviewNote: null,
      reviewedAt: null,
    },
  });
  refresh();
}

export async function withdrawQuestion(id: string): Promise<ActionResult> {
  const user = await requireLandlord();
  const question = await ownQuestion(id, user.id);
  if (!question) return { error: "Question not found." };
  if (question.status !== "SUBMITTED")
    return { error: "Only a pending suggestion can be withdrawn." };
  await prisma.customQuestion.update({
    where: { id },
    data: { status: "PRIVATE", submittedAt: null },
  });
  refresh();
}
