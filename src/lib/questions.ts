import { prisma } from "@/lib/prisma";
import type {
  QuestionRecord,
  QuestionStatusName,
  QuestionTypeName,
} from "@/lib/details/custom";

// Questions a landlord sees in their walk-through: everything they wrote
// (whatever its review status) plus every approved question.
export async function visibleQuestions(landlordId: string) {
  return prisma.customQuestion.findMany({
    where: { OR: [{ authorId: landlordId }, { status: "APPROVED" }] },
    orderBy: { createdAt: "asc" },
  });
}

type Row = {
  key: string;
  label: string;
  help: string | null;
  type: string;
  options: unknown;
  unit: string | null;
  section: string;
};

export const toRecord = (q: Row): QuestionRecord => ({
  key: q.key,
  label: q.label,
  help: q.help,
  type: q.type as QuestionTypeName,
  options: q.options,
  unit: q.unit,
  section: q.section,
});

export type QuestionView = QuestionRecord & {
  id: string;
  mine: boolean;
  status: QuestionStatusName;
  submitNote: string | null;
  reviewNote: string | null;
};

// How many units have an answer stored under a question's key — shown to the
// reviewer so popular questions stand out. Keys are generated hex, so building
// the JSON path from one is safe.
export async function usageCount(key: string): Promise<number> {
  const path = `$.**."${key.replace(/[^a-z0-9_]/g, "")}"`;
  const rows = await prisma.$queryRaw<{ n: number }[]>`
    SELECT count(*)::int AS n FROM units
    WHERE jsonb_path_exists(COALESCE(details, '{}'::jsonb), ${path}::jsonpath)
       OR jsonb_path_exists(COALESCE(rooms, '[]'::jsonb), ${path}::jsonpath)`;
  return rows[0]?.n ?? 0;
}
