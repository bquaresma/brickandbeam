import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireLandlord } from "@/lib/current-user";
import { signOut } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireLandlord();

  const newLeadCount = await prisma.lead.count({
    where: { status: "NEW", listing: { unit: { property: { landlordId: user.id } } } },
  });

  return (
    <div className="min-h-screen bg-[#FBF0E1]">
      <header className="border-b border-[#e7d9c3] bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-6">
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
          </div>
          <div className="flex items-center gap-4 text-sm text-stone-600">
            <span>{user.email}</span>
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
