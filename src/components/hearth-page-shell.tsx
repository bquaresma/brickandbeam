import { Spectral } from "next/font/google";

import { HomeIcon } from "@/components/listing-icons";

const spectral = Spectral({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-spectral",
});

// Brand palette — "Hearth". Scoped to the public coming-soon / get-started
// pages only, same as the listing page's own "Industrial Heritage" palette.
export const HEARTH = {
  heading: "#3D2E24", // charcoal-brown
  body: "#7A5B48", // warm taupe
  accent: "#B1502F", // rust
  accentHover: "#8F3F25",
  gold: "#C99A4E", // brass-gold
};

export function HearthPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${spectral.variable} flex flex-1 flex-col`}>
      <div
        className="flex h-16 flex-shrink-0 items-center px-7"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(20,12,6,0.32) 0%, rgba(20,12,6,0.5) 100%), url(/wood-beam.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          boxShadow:
            "inset 0 2px 0 rgba(255,255,255,0.12), inset 0 -4px 8px rgba(0,0,0,0.45)",
        }}
      >
        <span
          className="text-xs font-semibold tracking-[0.14em] uppercase"
          style={{ color: HEARTH.gold, textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
        >
          Brick and Beam
        </span>
      </div>

      <div
        className="flex flex-1 flex-col items-center justify-center px-4 text-center"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 620px 460px at 50% 38%, #F6DEC0 0%, #FBF0E1 60%, #FBF0E1 100%)",
        }}
      >
        <HomeIcon className="mb-4 h-9 w-9" style={{ color: HEARTH.gold }} />
        {children}
      </div>

      <div
        className="h-14 flex-shrink-0"
        style={{
          backgroundImage: "url(/antique-brick.jpg)",
          backgroundSize: "190px 127px",
          backgroundRepeat: "repeat",
          backgroundPosition: "0 -34px",
          boxShadow: "inset 0 3px 6px rgba(0,0,0,0.18)",
        }}
      />
    </div>
  );
}
