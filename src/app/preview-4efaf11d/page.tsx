import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function HomePreview() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-semibold text-stone-900">Brick and Beam</h1>
      <p className="mt-3 max-w-md text-stone-600">
        A landlord toolkit built for one-of-a-kind older homes — not a bed/bath/sqft grid.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/signup"
          className="rounded-md bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-800"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
