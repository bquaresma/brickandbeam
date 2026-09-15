import Link from "next/link";

import { requireLandlord } from "@/lib/current-user";
import { signOut } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireLandlord();

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link href="/dashboard" className="font-semibold text-stone-900">
            Brick and Beam
          </Link>
          <div className="flex items-center gap-4 text-sm text-stone-600">
            <span>{user.email}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button type="submit" className="underline hover:text-stone-900">
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
