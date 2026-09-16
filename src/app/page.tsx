import { HearthPageShell, HEARTH } from "@/components/hearth-page-shell";

export default function Home() {
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
        A landlord toolkit built for one-of-a-kind older homes. We&apos;re putting on the
        finishing touches — coming soon.
      </p>
    </HearthPageShell>
  );
}
