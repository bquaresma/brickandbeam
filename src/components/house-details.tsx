import type { PublicGroup } from "@/lib/details/format";

const BRICK = "#9A4635";
const TIMBER = "#6B4A34";
const CHARCOAL = "#262626";

// The public details: a row of "at a glance" chips, then four foldable groups.
// Sections arrive already filtered, so unanswered and "Not sure" answers never
// reach this far. Native <details> keeps it keyboard-friendly without script.
export function HouseDetails({
  groups,
  highlights,
  quirks,
}: {
  groups: PublicGroup[];
  highlights: string[];
  quirks: string[];
}) {
  return (
    <div>
      {(highlights.length > 0 || quirks.length > 0) && (
        <div className="mb-5" aria-label="At a glance">
          {highlights.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {highlights.map((text) => (
                <li
                  key={text}
                  className="rounded-full border px-3 py-1 text-sm font-medium"
                  style={{
                    borderColor: `${BRICK}55`,
                    color: BRICK,
                    backgroundColor: `${BRICK}0f`,
                  }}
                >
                  {text}
                </li>
              ))}
            </ul>
          )}
          {quirks.length > 0 && (
            <div className="mt-3">
              <p
                className="text-xs font-semibold tracking-wide uppercase"
                style={{ color: `${TIMBER}b3` }}
              >
                Worth knowing
              </p>
              <ul className="mt-1.5 flex flex-wrap gap-2">
                {quirks.map((text) => (
                  <li
                    key={text}
                    className="rounded-full border bg-white px-3 py-1 text-sm"
                    style={{ borderColor: `${TIMBER}40`, color: "#3d342c" }}
                  >
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        {groups.map((group) => (
          <details
            key={group.key}
            open={group.open}
            className="group rounded-lg border bg-white"
            style={{ borderColor: `${TIMBER}26` }}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
              <span
                className="text-lg font-medium"
                style={{ fontFamily: "var(--font-spectral)", color: CHARCOAL }}
              >
                {group.title}
              </span>
              <span
                className="flex items-center gap-3 text-sm"
                style={{ color: `${TIMBER}b3` }}
              >
                {group.count} {group.count === 1 ? "detail" : "details"}
                <span aria-hidden className="transition-transform group-open:rotate-90">
                  ›
                </span>
              </span>
            </summary>

            <div
              className="grid grid-cols-1 gap-4 border-t px-5 py-4 md:grid-cols-2"
              style={{ borderColor: `${TIMBER}1a` }}
            >
              {group.sections.map((section) => (
                <div key={section.key}>
                  {/* A group holding one card of the same name needs no second heading. */}
                  {!(group.sections.length === 1 && section.title === group.title) && (
                    <h3 className="text-base font-medium" style={{ color: CHARCOAL }}>
                      {section.title}
                    </h3>
                  )}
                  <div className="mt-2 space-y-3">
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
          </details>
        ))}
      </div>
    </div>
  );
}
