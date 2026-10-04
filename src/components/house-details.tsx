import type { PublicSection } from "@/lib/details/format";

const TIMBER = "#6B4A34";
const CHARCOAL = "#262626";

// The public "details" cards. The sections arrive already filtered by
// publicSections(): unanswered and "Not sure" answers never reach this far.
export function HouseDetails({ sections }: { sections: PublicSection[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {sections.map((section) => (
        <div
          key={section.key}
          className="rounded-lg border bg-white p-5"
          style={{ borderColor: `${TIMBER}26` }}
        >
          <h3
            className="text-lg font-medium"
            style={{ fontFamily: "var(--font-spectral)", color: CHARCOAL }}
          >
            {section.title}
          </h3>
          <div className="mt-3 space-y-4">
            {section.blocks.map((block, i) => (
              <div key={block.title ?? i}>
                {block.title && (
                  <h4 className="text-sm font-semibold" style={{ color: TIMBER }}>
                    {block.title}
                  </h4>
                )}
                <dl className="mt-1 space-y-1.5 text-sm">
                  {block.lines
                    .filter((l) => !l.multiline)
                    .map((line) => (
                      <div key={line.label} className="flex flex-wrap gap-x-2">
                        <dt style={{ color: `${TIMBER}cc` }}>{line.label}:</dt>
                        <dd className="font-medium" style={{ color: "#3d342c" }}>
                          {line.text}
                        </dd>
                      </div>
                    ))}
                </dl>
                {block.lines
                  .filter((l) => l.multiline)
                  .map((line) => (
                    <p
                      key={line.label}
                      className="mt-2 text-sm leading-relaxed"
                      style={{ color: "#3d342c" }}
                    >
                      <span className="font-medium">{line.label}: </span>
                      {line.text}
                    </p>
                  ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
