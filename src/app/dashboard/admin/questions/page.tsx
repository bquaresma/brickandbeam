import { ReviewCard, type ReviewItem } from "@/components/review-card";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/current-user";
import { catalogSnippet, PLACEMENTS, type QuestionTypeName } from "@/lib/details/custom";
import { toRecord, usageCount } from "@/lib/questions";

export const dynamic = "force-dynamic";

export default async function ReviewQuestionsPage() {
  await requireAdmin();

  const [pending, decided] = await Promise.all([
    prisma.customQuestion.findMany({
      where: { status: "SUBMITTED" },
      orderBy: { submittedAt: "asc" },
      include: { author: { select: { name: true, email: true } } },
    }),
    prisma.customQuestion.findMany({
      where: { status: { in: ["APPROVED", "REJECTED"] } },
      orderBy: { reviewedAt: "desc" },
      take: 20,
      include: { author: { select: { name: true, email: true } } },
    }),
  ]);

  const items: ReviewItem[] = await Promise.all(
    pending.map(async (q) => ({
      id: q.id,
      label: q.label,
      help: q.help,
      type: q.type as QuestionTypeName,
      options: Array.isArray(q.options) ? (q.options as { label: string }[]) : [],
      unit: q.unit,
      section: q.section,
      author: q.author.name || q.author.email,
      submitNote: q.submitNote,
      usage: await usageCount(q.key),
      snippet: catalogSnippet(toRecord(q)),
    })),
  );

  const placement = (v: string) => PLACEMENTS.find((p) => p.value === v)?.label ?? v;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#3D2E24]">
        Review suggested questions
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-stone-600">
        Landlords can add their own questions to the house walk-through. When one suggests
        a question for everyone, it lands here. Approving it makes it appear in every
        landlord&apos;s walk-through right away; rejecting it leaves it working for its
        author only. Landlords&apos; answers about their own houses are never shown here.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-[#3D2E24]">
        Waiting for review ({items.length})
      </h2>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-stone-500">Nothing to review.</p>
      ) : (
        <ul className="mt-3 space-y-4">
          {items.map((item) => (
            <ReviewCard key={item.id} item={item} />
          ))}
        </ul>
      )}

      {decided.length > 0 && (
        <>
          <h2 className="mt-10 text-lg font-semibold text-[#3D2E24]">Recently decided</h2>
          <ul className="mt-3 divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
            {decided.map((q) => (
              <li key={q.id} className="p-4 text-sm">
                <p className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium text-stone-800">{q.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      q.status === "APPROVED"
                        ? "bg-green-100 text-green-800"
                        : "bg-stone-200 text-stone-700"
                    }`}
                  >
                    {q.status === "APPROVED" ? "Approved" : "Rejected"}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-stone-500">
                  {q.author.name || q.author.email} · in {placement(q.section)}
                  {q.reviewNote ? ` · ${q.reviewNote}` : ""}
                </p>
                {q.status === "APPROVED" && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-stone-500">
                      Make it a built-in question (code)
                    </summary>
                    <pre className="mt-2 overflow-auto rounded bg-stone-900 p-3 text-xs text-stone-100">
                      {catalogSnippet(toRecord(q))}
                    </pre>
                  </details>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
