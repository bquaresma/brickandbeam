import type { Metadata } from "next";
import Link from "next/link";

import { HearthPageShell, HEARTH } from "@/components/hearth-page-shell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function HomePreview() {
  return (
    <HearthPageShell>
      <h1
        className="text-4xl font-semibold"
        style={{ fontFamily: "var(--font-spectral)", color: HEARTH.heading }}
      >
        Brick and Beam
      </h1>
      <p
        className="mt-3 max-w-md text-base leading-relaxed"
        style={{ color: HEARTH.body }}
      >
        A landlord toolkit built for one-of-a-kind older homes — the ones that don&apos;t
        fit a listing template.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/signup"
          className="rounded-md px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#8F3F25]"
          style={{ backgroundColor: HEARTH.accent }}
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="rounded-md border px-6 py-3 text-sm font-semibold transition-colors hover:bg-white"
          style={{ borderColor: `${HEARTH.gold}99`, color: HEARTH.heading }}
        >
          Sign in
        </Link>
      </div>
    </HearthPageShell>
  );
}
