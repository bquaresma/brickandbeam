import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireLandlord } from "@/lib/current-user";
import { signOut } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireLandlord();

  const newLeadCount = await prisma.lead.count({
    where: { status: "NEW", listing: { unit: { property: { landlordId: user.id } } } },
  });

  // Admins see how many suggested questions are waiting for review.
  const isAdmin = isAdminEmail(user.email);
  const pendingQuestions = isAdmin
    ? await prisma.customQuestion.count({ where: { status: "SUBMITTED" } })
    : 0;

  return (
    <div className="min-h-screen bg-[#FBF0E1]">
      <header className="border-b border-[#e7d9c3] bg-white print:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/dashboard" className="font-semibold text-[#3D2E24]">
              Brick and Beam
            </Link>
            <Link
              href="/dashboard/leads"
              className="flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-[#B1502F]"
            >
              Leads
              {newLeadCount > 0 && (
                <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-800">
                  {newLeadCount}
                </span>
              )}
            </Link>
            {isAdmin && (
              <Link
                href="/dashboard/admin/questions"
                className="flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-[#B1502F]"
              >
                Review
                {pendingQuestions > 0 && (
                  <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">
                    {pendingQuestions}
                  </span>
                )}
              </Link>
            )}
          </div>
          <div className="flex min-w-0 items-center gap-4 text-sm text-stone-600">
            {/* Hidden on phones, where it would push the page wider than the screen. */}
            <span className="hidden truncate sm:inline">{user.email}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button type="submit" className="underline hover:text-[#B1502F]">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </div>
  );
}
