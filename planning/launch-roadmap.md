# Launch Roadmap — advertise February 2027, available March 2027

**Owner:** Brian Quaresma
**Status:** Draft for review — nothing here is built yet
**Drafted:** October 4, 2026 (fourth revision the same day; supersedes the earlier drafts)
**Parent plan:** [`old-home-rental-toolkit-plan.md`](old-home-rental-toolkit-plan.md)

## 0. Decisions that shape this plan

| Decision        | Choice                                                                                                                                                                                                                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The property    | **325 44th Street, Pittsburgh, PA 15201.** Whole-house, and built **1900** per the county record, so federal lead disclosure applies. Brian enters the rest of the property details through the app's own forms — that entry is the first real test of the workflow. |
| Dates           | **Start advertising in February 2027; property available March 2027.** Assumes Feb 1 and Mar 1 — adjust if the real dates differ. About 17 weeks from today to Feb 1.                                                                                                |
| Scope           | End to end for the test property: list → leads → applications → screening → decision → **lease generation** → **rent collection** → **maintenance**. Parent plan Phases 1–2, narrowed to one landlord and one house.                                                 |
| Target market   | **Whole-house rentals of older properties and unique properties.** The parent plan's "converted multi-units" emphasis is dropped (see below).                                                                                                                        |
| Ownership       | **Individual — no LLC** for the first house. The lease, Stripe account and any City filings are in Brian's own name. The app needs a landlord legal name and notice address (Stage 2), not an entity model.                                                          |
| Attorney        | **None yet.** Brian is making the referral call by Oct 18, starting with his real estate agent for a recommendation (§10, brief in §17).                                                                                                                             |
| Build principle | Each capability is **native by the date it is first needed**; before that it has a defined **interim** (§11) so the real tenancy never waits on unbuilt software.                                                                                                    |
| Where it runs   | **Local until January — nothing deploys before then.** Then **AWS, upgraded to production grade** (§12). $0 AWS spend until the January deploy.                                                                                                                      |
| Domain and URL  | `brickandbeamrentals.com` is the production URL (owned, Porkbun). Free `leasing@` forwarding alias from now.                                                                                                                                                         |
| Local services  | **Postgres only.** Storage writes to a local folder and email to the console plus a dev outbox page, both behind adapters. Cloud versions (S3, SES) are built at the go-live gate, when they can be tested for real.                                                 |
| Channels        | **Free or easy-to-post sites first** (§9). **TurboTenant and Avail are not used.**                                                                                                                                                                                   |
| Zillow feed     | **Deferred** (§13). Manual Zillow Rental Manager posting stays in the channel kit.                                                                                                                                                                                   |
| Money           | The libraries are free. What actually costs money is itemized in **§14**: AWS ≈ $55/month from January, attorney fees, per-screening and payment-processing fees, and small items.                                                                                   |

**Whole-house focus — consequences.** `Property.isWholeHouse` becomes the **default** path when creating a property.
Multi-unit keeps working but gets no new investment. Whole-house specifics (yard, porch, basement, attic, garage,
outbuildings) become room types and character tags, not new columns. An optional `propertyStyle` (rowhouse, Victorian,
farmhouse, carriage house, converted church/school/warehouse, other) feeds ad copy. The parent plan's persona should be updated to match.

**Adapter rule.** Anything that talks to the outside world (file storage, email, later screening, e-sign, payments) is
an interface plus a local implementation. Store storage **keys**, never URLs, in the database.

### Schedule

| Window          | Work                                                                                                                                                                                | Milestone                                                                                             |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Oct 5 – Oct 18  | **Stage 0** foundation. Brian: call the lawyer-referral line and collect 2–3 flat-fee quotes (§10), get the "no permit needed" answer confirmed in writing (§10)                    | **M0** foundation done                                                                                |
| Oct 19 – Nov 15 | **Stage 1** listing half + compliance tracker, started early because Stage 0 finished Oct 4 (about six weeks for the larger photo and room-detail work). Attorney engaged by Nov 15 | **M1 — dress rehearsal 1:** the property is fully listed locally; ads and photo zip generated         |
| Nov 16 – Dec 20 | **Stages 2–3** applicant pipeline, screening tracking, decision. Attorney reviews criteria, application, adverse-action notice (Dec)                                                | **M2 — dress rehearsal 2:** a fake applicant goes list → lead → prescreen → apply → decision, locally |
| Dec 21 – Jan 3  | Holiday buffer (spill-over from Stages 2–3). **Prod-grade Terraform edits, code only — nothing applies until Deploy is run** (§12)                                                  | —                                                                                                     |
| Jan 4 – Jan 24  | **Stage 4** go-live gate: deploy, harden, SES email, legal sign-off, real property and photos entered                                                                               | **M3** production up on the real domain; backup restore tested                                        |
| Jan 25 – Jan 31 | Final checks, ads drafted                                                                                                                                                           | —                                                                                                     |
| **Feb 1**       | **Start advertising**                                                                                                                                                               | **M4**                                                                                                |
| Feb 1 – Feb 28  | **Stage 5** lease generation, e-sign, deposit and first-rent collection — built while applicants flow in                                                                            | **M5** ready before the first lease signing (target Feb 22)                                           |
| Mar 1 →         | Move-in. **Stage 6** tenant portal, recurring rent, maintenance                                                                                                                     | **M6**                                                                                                |

Dates assume steady weekly progress and are estimates, not promises.

**Native by when:**

- **By Feb 1 (first applicant):** listing, channel kit, leads, compliance tracker, prescreen, application, lead-paint disclosure gate, screening tracking, decision + adverse-action notice.
- **By lease signing (~late Feb):** lease generation, e-sign, security deposit and first rent.
- **After move-in (Mar–Apr):** tenant portal, recurring rent and reminders, maintenance requests, renewals.

**If we fall behind, cut in this order:** (1) in-app lease generation → attorney-reviewed lease signed with an external e-sign
tool, app stores the result; (2) in-app rent collection → manual ledger entries for Zelle/checks; (3) maintenance portal →
landlord logs requests from email/text; (4) rooms-editor polish, share cards, flyer. **Never cut:** compliance tracker,
lead-disclosure gates, adverse-action notice, Fair Housing guardrails, database backups.

## 1. Where the project stands (audit, 2026-10-04)

Built: landlord auth, property/unit/listing CRUD (incl. whole-house mode), Zillow-shaped amenity/pet/fee/utility
records, public listing page, map and Street View links, address autocomplete, lead capture + unified inbox.
About 4,450 lines of TS; lint, `tsc` and Prettier are clean. No tests. No seed script. Local DB has one user and no properties.

### Issues found

| #   | Issue                                                                                                                                                                                                                                                                               | Where                                              | Severity   |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ---------- |
| A   | Login doesn't lowercase email but signup does — mixed-case sign-in fails with "Invalid email or password"                                                                                                                                                                           | `src/app/(auth)/login/page.tsx`, `src/lib/auth.ts` | Bug        |
| B   | Public listing page puts the landlord's **login email** in a `mailto:` link in public HTML                                                                                                                                                                                          | `src/app/listings/[listingId]/page.tsx:204`        | Privacy    |
| C   | Draft/archived listings 404 **even for the owner**, so there is no draft preview; README claims owners can see them                                                                                                                                                                 | `getListing()` in the listing page                 | Gap        |
| D   | Public lead form: no honeypot, rate limit or length caps; landlord is never notified of a new lead                                                                                                                                                                                  | `src/lib/actions/leads.ts`                         | Gap        |
| E   | Each public page view makes 1–2 uncached Mapbox geocode calls                                                                                                                                                                                                                       | `src/lib/geocode.ts`, listing page                 | Perf/quota |
| F   | `Unit.rooms` (the "non-standard layout" differentiator) has **no UI and no rendering**; only freeform `layoutNotes` exists                                                                                                                                                          | `prisma/schema.prisma`, `unit-form.tsx`            | Gap        |
| G   | Next 16.3.5 has a critical advisory (RCE in `next/og`, which the app doesn't use). Patch fix: 16.3.8, non-major                                                                                                                                                                     | `package.json`                                     | Security   |
| H   | No share metadata (OG/Twitter), `sitemap`/`robots`; listing images use raw `<img>`; photos are URL fields only                                                                                                                                                                      | listing page                                       | Gap        |
| I   | No tests, no seed script, no password reset or email verification; root README and design README are stale                                                                                                                                                                          | repo                                               | Hygiene    |
| J   | No place to record a property's compliance state (rental permit, occupancy permit, lead inspection) or attach documents                                                                                                                                                             | schema                                             | Gap        |
| K   | A lead can only arrive through the public form; inquiries from Craigslist, Facebook, etc. can't be entered by hand                                                                                                                                                                  | `src/lib/actions/leads.ts`, inbox                  | Gap        |
| L   | The AWS config is dev-grade: 3-day DB backups, `skip_final_snapshot = true`, `deletion_protection = false`, no `storage_encrypted` setting. **Deploy runs `terraform apply -auto-approve` on both stacks with no preview step**, and Teardown deletes the database with no snapshot | `infra/data/rds.tf`, `deploy.yml`, `teardown.yml`  | Go-live    |

`npm audit` also flags Prisma, but only through its CLI's `deepmerge-ts`. npm's suggested fix is a downgrade to 6.12.0;
**do not run `npm audit fix --force`**. Issue L is fixed in Stage 4 (§12): both a throwaway database and a tenant's records
can't share the same safety settings.

## 2. Stage 0 — Foundation (Oct 5 – Oct 18)

| Step | Work                                                                                                                                                                                                                                                                                                                                                       | Done when                                                                      |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 0.1  | `normalizeEmail()` helper used by signup, `authorize`, and `createLead` (fixes A)                                                                                                                                                                                                                                                                          | Sign in works with `Brian@Example.com` after signing up as `brian@example.com` |
| 0.2  | Bump `next` and `eslint-config-next` to 16.3.8; rebuild (fixes G)                                                                                                                                                                                                                                                                                          | `npm run build` green; `npm audit --omit=dev` shows no critical                |
| 0.3  | Replace the account-email `mailto:` with a **public contact email** field (per property, defaulting to `leasing@brickandbeamrentals.com`, a free Porkbun forwarding alias — §12) (fixes B)                                                                                                                                                                 | View-source on a listing contains no account email                             |
| 0.4  | Owner draft preview: owner sees their own DRAFT/ARCHIVED listing with a visible "Draft — not public" banner (fixes C)                                                                                                                                                                                                                                      | Draft opens for owner, 404s when logged out                                    |
| 0.5  | Store `latitude`/`longitude` (and alley lat/lng) on `Property`, geocoded on save; listing page reads stored values (fixes E)                                                                                                                                                                                                                               | Listing page makes zero Mapbox calls                                           |
| 0.6  | Seed script: `prisma/seed.ts`, `npm run db:seed`, `npm run db:reset`. Seeds a **fictional** sample property with sample leads, for development, tests and the dress rehearsals. The real property is **not** seeded — Brian enters 325 44th Street through the app's own forms. Runs under Node 24's built-in TS support (no new dependency; verify first) | One command rebuilds a populated local DB                                      |
| 0.7  | Test harness: Vitest for pure logic (compliance, `parseLatLng`, form parsers, formatters) and **one** Playwright smoke test: signup → property → listing → publish → submit lead → see in inbox. Separate `brickandbeam_test` database in the existing Postgres container                                                                                  | `npm test` green; smoke test green locally                                     |
| 0.8  | Add a Postgres service to `ci.yml` and run tests there (CI only, no deploy)                                                                                                                                                                                                                                                                                | CI green on a PR                                                               |
| 0.9  | Lead-form guard: honeypot field, length caps, same email + listing within 10 min is accepted silently as a duplicate (fixes D, part 1)                                                                                                                                                                                                                     | Bot-style submission creates no row; duplicate doesn't double up               |
| 0.10 | `src/lib/adapters/storage`: interface + local driver (`STORAGE_DRIVER=local`). The **email adapter** (console driver + `Email` outbox table at `/dashboard/dev/outbox`, dev only) is built when the first email-sending feature lands — Stage 2 magic links at the latest                                                                                  | Photos round-trip through the adapter; no direct filesystem calls elsewhere    |
| 0.11 | `isWholeHouse` becomes the default in the property form; refresh `README.md` and `design/listing-page-mockup/README.md` to match reality                                                                                                                                                                                                                   | No stale claims; new properties default to whole-house                         |

New dependencies at this stage: `vitest`, `@playwright/test` (both free — §14).

## 3. Stage 1 — Listing half and the property's paperwork (started Oct 5; due Nov 15)

Order: adapters (0.10) first; photos unblock the gallery and the photo zip; the compliance tracker (1.6) is independent and
can start any time. Share/discovery work (old 1.3) moves to Stage 4, when a public URL exists.

### 1.1 Photo pipeline and conversion (L)

Every upload is converted once into a set of sizes and formats built for the web and for phones. Landlords upload whatever
the camera produced; visitors get small, sharp, fast images.

- **Model:** `ListingPhoto { id, listingId, storageKey (the master), kind PHOTO|FLOOR_PLAN, area, level, caption, altText, sortOrder, isHero, width, height, contentType, bytes, placeholder, variants (JSON list of preset, width, format, key, bytes), processedAt }`. `area` is EXTERIOR, LIVING, KITCHEN, BATHROOM, BEDROOM, BASEMENT, ATTIC, OUTDOOR, DETAIL or OTHER; `level` (Basement, First floor, Second floor, Attic) is used by floor plans. Migrate `heroPhotoUrl`/`floorPlanUrl` into it (keep the old columns until the migration is verified, then drop).
- **Accept:** JPEG, PNG, WebP, and HEIC/HEIF if the spike allows. Check magic bytes, not just the declared type; cap at ~30 MB and ~100 megapixels per file; reject everything else with a plain-language message.
- **Normalize into a master:** auto-rotate from EXIF orientation, **convert to sRGB** (iPhones shoot wide-gamut Display P3, which looks wrong on browsers that aren't color-managed), **strip all metadata — EXIF GPS in photos of a home would leak its exact location**, cap the long edge at 3000 px, and store it as a high-quality JPEG (PNG for floor plans). The master is never served publicly.
- **Generate from the master:**
  - **Display ladder:** widths 400 / 800 / 1200 / 1600 px (never upscaled past the master; 2400 px is made only for floor plans) in **AVIF, WebP and progressive JPEG**. Starting quality: AVIF ≈ 50, WebP ≈ 75, JPEG ≈ 78. Budget: hero at 800 px AVIF ≤ ~120 KB, gallery thumbnails ≤ ~40 KB.
  - **Share:** 1200 × 630 JPEG with an attention-based crop, for link previews (Stage 4).
  - **Export:** 2048 px long-edge JPEG for the channel kit zip (1.4) — sRGB, no metadata, small enough to upload to the listing sites.
  - **Placeholder:** a tiny blurred image stored with the row, shown while the real one loads.
  - **Floor plans use a different profile:** no crop, lossless or near-lossless WebP with a PNG fallback (JPEG artifacts ruin line art), widths 800 / 1600 / 2400 px so a plan can be zoomed.
- **Serving:** a `GET /media/[...key]` route handler with long-lived immutable caching (keys include a content hash). The page renders `<picture>` with AVIF → WebP → JPEG sources, `srcset` and `sizes`, explicit `width`/`height` so nothing jumps while loading, `loading="lazy"` and `decoding="async"` below the fold, and `fetchpriority="high"` on the hero. **Not `next/image`:** precomputed variants are deterministic, work from S3 or a CDN later, and survive an ECS task being replaced, whereas `next/image` re-encodes at request time inside a small container and keeps its cache on ephemeral disk.
- **Reprocessing:** the master is kept, so a "regenerate variants" command rebuilds everything if the presets change.
- **Upload path:** a **route handler** (`POST /api/uploads`, multipart), not a server action — Next 16 caps action bodies at **1 MB** by default (`serverActions.bodySizeLimit`). One photo per request, **sent one at a time**, converted inline in that request, with the server allowing only one conversion at a time (spike results below), plus per-file progress and errors. Auth + ownership check (listing → unit → property → landlord) on every call.
- **UI:** drag-and-drop on the listing edit page, tag each photo with an area, reorder, pick the hero, alt text prefilled from the area and editable. Public gallery: hero + grid grouped by area + a keyboard-accessible lightbox.
- **Spike results (Oct 4):**
  - **HEIC cannot be decoded on the server.** A valid HEIC file (made with macOS's own encoder, and opened fine by macOS) parses its header but fails to decode in the `sharp` we ship, on both the macOS and the Linux x64 builds — the prebuilt image library has no HEVC decoder. AVIF and WebP encode fine. So HEIC is handled before the server: (1) the file picker's `accept` lists only JPEG, PNG and WebP, which makes iOS Safari convert HEIC to JPEG at pick time — **still to confirm on a real iPhone; a two-minute test page is in `scripts/heic-device-test/`**; (2) the server detects HEIC by its first bytes and replies with plain instructions (Photos → Share → Options → Most Compatible, or Settings → Camera → Formats → Most Compatible); (3) if the iPhone check shows HEIC getting through, add a free in-browser HEIC-to-JPEG converter. Not doing: building an HEVC decoder into the image (heavy and patent-encumbered).
  - **Conversion cost.** The first pipeline (re-decode a 4000 px master for every variant, plus a 2400 px AVIF) took about **58 s and 644 MB** for one 12-megapixel photo at the production task's 0.25 vCPU. The lean pipeline — decode once to raw sRGB pixels at ≤ 3000 px, derive every variant from them, libvips cache off, `sharp` concurrency 1, AVIF effort 3 — took **0.8 s** on this Mac, **7 s** at 0.25 vCPU (Linux arm64, native) and **14 s** (Linux x64 under emulation, the pessimistic case), with a **peak of 210–283 MB**. That is the design above.
  - **Memory fit.** The idle Next.js container uses about 55 MB, so one conversion at a time fits in 0.5 GB on paper (≈ 340 MB), but with thin margin once the app is busy. **1 GB is recommended (≈ +$1.60/month).**
  - **Consequence.** The server converts one photo at a time and the browser sends them sequentially. About 30 photos is roughly 4–7 minutes of background work at 0.25 vCPU, and the site is slower while it runs — acceptable for an occasional landlord action. Shrinking photos in the browser to ≤ 3000 px before upload (optional, later) would cut both upload size and server time.
  - **Caveats.** The test photo was synthetic noise, so its file sizes mean nothing; the size budgets get re-checked with real photos of the house. x86 emulation overstates time.
- **Done when:** ten phone-sized photos (including an iPhone photo, handled per the spike results) upload, convert, reorder and render on the public page in AVIF with WebP/JPEG fallbacks; no served file contains GPS; the hero loads under budget on a throttled mobile profile; deleting a photo removes the master and every variant; another landlord's listing rejects the upload (tested).

### 1.2 Rooms, floor plans, and what makes an old house different (L)

**Principles.** Every field is optional. Where a landlord might not know, the answer is **Yes / No / Not sure**, and "Not sure"
is **never shown publicly** (the landlord sees it as an open item). Every area has a free-text note. The public page shows only
what was answered, in a plain, honest tone. Old houses are chosen for their character, and renters want the quirks stated up
front.

**Guided walk-through.** Area cards: _Rooms and floor plans · Kitchen · Bathrooms (one card per bathroom) · Basement ·
Systems · Character and quirks · Outdoors and parking_. Built for a phone — a landlord can fill it in while walking the
house — with chips and toggles instead of long forms, save per card, and a completeness meter. Photos can be tagged to an
area (1.1) so each card can show its own pictures.

**Floor plans (added).**

- One image per **level** (Basement, First floor, Second floor, Attic…), uploaded through the 1.1 pipeline as `kind = FLOOR_PLAN` with a `level`. A phone photo of a hand sketch is fine; so is a scan or an export from a measuring app.
- Each room carries a `level` and an optional **marker** (`A`, `1`…) that matches a label on the sketch.
- Public page: a tab per level, a zoomable plan, and a **text legend of rooms beside it** so the information is accessible without the image.
- Every plan carries an **"Approximate — not to scale"** label. Dimensions are optional.
- Later idea, not scheduled: a simple block diagram generated from room dimensions.

**Rooms.** Name, type (bedroom, non-conforming bedroom, bath, kitchen, living, dining, attic, basement, porch, yard, garage, outbuilding, other), level, marker, optional length × width in feet, ceiling-height note, natural light (window count and direction), feature tags (closet, built-ins, fireplace, pocket doors, transom…), notes, and **"Counts as a bedroom?" Yes / No / Not sure** (closet and exit window) rather than a vague "conforming" flag. Validated with `zod`.

**Kitchen.**

- Layout: galley, eat-in, open, separate; approximate size; pantry or butler's pantry.
- Cabinets and counters: original or updated; counter material; floor material.
- **Range:** gas, electric, or none (bring your own) — and which hookups exist (gas line, 240 V outlet).
- Included appliances (existing tags); **space for a refrigerator** (width × depth × height, or "standard"); dishwasher yes / no / hookup only; disposal; microwave; range hood vented, recirculating or none.
- Outlets: how many, and whether they're GFCI-protected. Natural light and ventilation.
- Quirks prompt: sloping floor, sticking drawers, undersized fridge space, no dishwasher hookup.

**Bathrooms** (one entry each).

- Level and type: full, three-quarter, half.
- **Tub:** claw-foot, soaking, alcove, none. **Shower:** over the tub, separate stall, none (a shower over a claw-foot tub usually means a curtain ring — say so).
- Original or updated fixtures: pedestal sink, hex tile, vanity, high-tank toilet.
- **Ventilation:** exhaust fan, window only, neither. **Outlets:** none / one (GFCI) — older baths often have none, and a renter will want to know.
- Hot water note (capacity, how long it takes to arrive). Accessibility: steps to reach it, tub wall height. Year last updated.
- Quirks prompt: sloped ceiling, tight clearance, pressure, separate hot and cold taps.

**Basement.**

- Type: full, partial, crawlspace, none. Finish: unfinished, partly finished, finished.
- **Head clearance** (feet, or "low spots"); floor and walls: concrete, stone, brick, dirt.
- **Moisture:** dry, occasionally damp, has had water (year). Sump pump, French drain, dehumidifier included or not. Floor drain.
- Access: interior stairs (and how steep), exterior bulkhead; lighting.
- Tenant use: exclusive or shared storage, workshop, laundry.
- **Laundry** (its own small card, since location varies in old houses): basement, kitchen, bath, closet, none; washer hookup; dryer gas / electric / vent present; laundry sink.
- Mechanicals located here: furnace or boiler, water heater, electrical panel, meter.
- Optional: radon test result and date, if one exists (Allegheny County has a reputation for radon; ask the attorney how to word it, §17).

**Systems — the older-house specifics.**

- **Heat:** forced air, steam radiators, hot-water radiators, baseboard, none central; fuel; thermostat zones; radiator covers.
- **Cooling:** central, window units fine (and whether the windows suit them), mini-split, none.
- **Electrical:** fuse box or breakers; amperage (60 / 100 / 150 / 200 / not sure); grounded three-prong outlets throughout, some, or none; known wiring (modern, mixed, knob-and-tube remnants, not sure).
- **Plumbing:** supply pipes (copper, galvanized, PEX, mixed, not sure); **water service line material (lead, copper, not sure)** — a known-hazard item that sits beside the lead-paint disclosure; water heater type, size and age; sewer line (clay, updated, not sure).
- **Windows:** original wood sash, replaced, storm windows, screens; whether they open easily.
- **Insulation and drafts:** attic insulated; a free-text note. Optional **typical monthly utility range** if the landlord knows it — the number renters of old houses most want.

**Character and quirks** (the heart of the page). Chips plus free text:

- Surfaces: original hardwood or pine floors; plaster walls (and picture-hanging rules); picture rails; crown molding; wainscoting; tin ceilings; ceiling medallions.
- Built features: built-ins and bookcases; window seat; pocket doors; transoms; stained or leaded glass; original banister; back or servant stairs; butler's pantry; sleeping porch; dumbwaiter; coal chute; cupola.
- **Fireplace:** working wood, gas log, decorative, sealed; chimney inspected.
- **Shared party wall** (semi-detached — sound and neighbors).
- Quirks: steep or narrow stairs, low doorways or beams, uneven floors, sloped ceilings, sticking windows or doors, banging radiator pipes.
- **Furniture move-in notes:** narrowest doorway and stair width, tight turns — practical and rarely stated.
- **Known conditions (optional, landlord-chosen):** anything the landlord knows that a tenant would want to know before signing, such as asbestos tile or pipe wrap, past water intrusion or mold, a lead water line, knob-and-tube wiring. The lead-paint notice is added automatically. **Wording is the attorney's call** (§17).

**Outdoors and parking.** Porch, deck, yard (fenced or not), alley access (existing alley field), parking (existing type plus "street permit zone" and a note), trash and recycling day.

**Data model.** `Unit.rooms` (existing JSON) holds the rooms. A new versioned **`Unit.details`** JSON column holds the rest — `{ version: 1, kitchen, bathrooms[], basement, laundry, systems, character, knownConditions, outdoors }` — validated with `zod`, so adding a field later never needs a migration. This is display data today; the Zillow-shaped columns and records stay as they are. Floor-plan files and area-tagged photos use `ListingPhoto` (1.1).

**Public page.** "The house, room by room" (floor plan tabs + room legend); cards for Kitchen, Bathrooms and Basement with specs and honest notes; Systems; Character and quirks; and "Good to know" for known conditions — grouped, scannable, answered items only. The same data feeds the channel-kit ad templates (1.4) and the Fair Housing copy check.

**Sizing and schedule.** 1.1 and 1.2 are both large now. Stage 0 finished on Oct 4, so Stage 1 starts immediately and has about six weeks instead of four, at no cost to the later dates.

**Done when:** you can describe 325 44th Street's kitchen, bathroom, basement and quirks in about twenty minutes on a phone; a floor plan per level shows on the public page with its room legend; and nothing marked "Not sure" appears publicly.

### 1.3 Share and discovery — **moved to Stage 4** (§6)

Needs a public URL. Photos still generate the 1200×630 share variant in 1.1, so this is cheap to finish later.

### 1.4 Channel kit (M)

Posting is **manual by design** — Craigslist and Facebook restrict automated posting by individual landlords. The kit makes
manual posting fast and consistent (channels and rules in §9). Until Stage 4 every ad is **self-contained** (text + photos +
the public contact email); after it, ads also carry the listing link.

- Pure, unit-tested formatters, one per channel in §9: Zillow Rental Manager (field-by-field cheat sheet mirroring its form), Facebook Marketplace, Craigslist, Zumper, and Facebook groups.
- Share panel on the property page: copy buttons per channel, "download all photos as a zip" using the 2048 px export JPEGs from 1.1 (every one of these sites needs photo files uploaded).
- Every formatter appends the pre-1978 lead-paint notice automatically when `requiresLeadPaintDisclosure(buildYear)` is true (it is, for this house), the **rental permit number** if the compliance tracker (1.6) says one applies and is marked "include in ads", and the Equal Housing Opportunity statement.
- **Printable flyer** (print CSS): photo, key facts, `leasing@` address and phone. A QR code to the listing page arrives with Stage 4.
- **Fair Housing copy check:** an advisory-only linter on headline, story and preview text that flags phrasing that can read as discriminatory in housing ads (familial status, religion, "perfect for young professionals", and similar). Warnings, never blocking. Old-house marketing copy leans flowery, so this earns its place. Needs the attorney's sanity check before it is presented as guidance.
- New dependency: `fflate` for the zip (free).
- **Done when:** one click produces ready-to-paste text and a photo zip for each launch channel from the real property.

### 1.5 Lead handling (M)

- **Manual lead entry (fixes K):** add a lead by hand with a **channel** (Zillow, Facebook, Craigslist, Zumper, flyer/sign, referral, other), name, contact details, and the message — for inquiries that arrive by email, text or a platform's own inbox. `Lead.source` gives channel-performance visibility from day one.
- Expanded lead lifecycle: `NEW → CONTACTED → SHOWING_SCHEDULED → TOURED → APPLIED → ARCHIVED`, plus `Lead.notes`, `Lead.contactedAt` and an optional showing date/time. Showings happen in the real process, so they get a place to live.
- Reply from the inbox via a prefilled `mailto:` plus mark-contacted.
- **Done when:** a Facebook inquiry received by text can be logged in 30 seconds, moved through to "toured", and filtered by channel.

### 1.6 Property compliance tracker and documents (M) — Pittsburgh first

Neither the schema nor the dashboard can currently record a property's legal-to-rent state (fixes J). See §10.

- `PropertyDocument` (kind, storageKey, filename, issuedOn, expiresOn, notes) on the storage adapter; reused later for signed disclosures, leases and applicant documents.
- Per-property checklist items, each with status, date and attached document. Each item can be **Required / Not required / Unknown**, and "Not required" records **who determined it, when, and the basis** (for example, a City email attached as a document). Items: rental permit, occupancy permit, lead inspection/clearance, EPA pamphlet version supplied to tenants, lead hazard disclosure on file.
- For 325 44th Street the rental-permit item starts as **Not required — per Brian's real estate agent, 2026-10-04**, with the City's written confirmation pending (§10).
- Dashboard surfaces overdue/expiring items. Publish shows a **soft warning** if items are missing — not a hard block; the hard gates are the lead disclosure in the application and lease flows.
- `compliance.ts` grows from a one-line federal check into a jurisdiction rules table. **Pittsburgh/PA is the first jurisdiction**, replacing the parent plan's MD/MA/NY/RI examples as the first target.
- **Done when:** the property's checklist shows its true state, with any documents attached and expiry dates visible.

### Stage 1 exit criteria (M1, Nov 15)

**Dress rehearsal 1:** Brian enters 325 44th Street through the app's own forms (the first real test of the workflow) and it goes
through compliance checklist → converted photos, floor plans and room-by-room details → draft preview → publish → copy-ready ads and photo zip for each launch
channel → a channel inquiry logged by hand and moved to "toured" → flyer printed. Playwright smoke test where automatable;
lint, `tsc`, tests and CI green.

## 4. Stage 2 — Applicant pipeline (Nov 16 – Dec 20, with Stage 3)

- **Email adapter** (console driver + dev outbox) if not already built.
- **Landlord profile:** legal name and mailing address for notices — the lease and adverse-action notice need Brian's personal legal name and address, since there is no entity.
- **Applicant identity:** magic-link sign-in, no password, `APPLICANT` role (already in the schema). The `VerificationToken` table needed for it already exists.
- **Published rental criteria** per listing (income multiple, credit range, rental history, occupancy limits, pet rules), shown to applicants and applied **uniformly** — fixed before the first application arrives. Attorney reviews wording.
- **Prescreen questionnaire** per listing: move-in date, income range vs rent, pets, self-reported credit range. A "fit vs criteria" indicator is informational; the landlord decides. No auto-deny. Questions limited to lawful criteria (attorney review).
- **Digital application:** config-driven sections (applicant, occupants, residence history, employment/income, references, consent to screening, signature) with `zod` schemas, saved drafts, optional document upload on the storage adapter. **Do not collect SSN or ID images in the app** — SmartMove gathers identity data from the applicant itself (§13). Any uploaded income documents get a retention schedule set with the attorney.
- **Consent and signature** on the application: record the consent text version, timestamp, IP and user agent.
- **Lead-paint disclosure — gate 1 of 2:** the application cannot be submitted until the applicant has viewed and acknowledged the disclosure and the EPA pamphlet (required here: the house was built in 1900). Gate 2 is in the lease, Stage 5. Signed acknowledgments are retained 3+ years.
- **Interim fallback:** external form or PDF, with the lead disclosure still signed before the lease.
- **Done when:** a fake applicant completes prescreen → application → disclosure acknowledgment, and the landlord sees the full packet.

## 5. Stage 3 — Screening tracking and decision (with Stage 2)

- **Screening is tracked, not integrated:** the landlord invites the applicant to SmartMove by hand (§13); the app records requested/completed, the outcome summary and an attached report PDF (stored as a sensitive document).
- **Decision workflow:** a checklist of the published criteria, then approve / deny / waitlist with a required reason tied to a criterion. Waitlist keeps next-in-line applicants.
- **Adverse-action notice generator:** a denial based on a screening report triggers a notice with the content FCRA requires (the reporting agency's identity and contact details, that the agency did not make the decision, the right to a free report and to dispute). Template reviewed by the attorney. It is a legal requirement, not a courtesy.
- **Guardrails:** consistent criteria, no auto-deny, an audit log of every decision and who made it.
- **Later, not needed for the test case:** a `ScreeningProvider` interface with a Mock adapter and a SmartMove API adapter.
- **Done when (M2, Dec 20):** fake applicants are approved and denied end to end and a denial produces a correct notice.

## 6. Stage 4 — Go-live gate (Jan 4 – Jan 24)

Nothing deploys before Jan 4. The Terraform edits below are written in the Dec 21 – Jan 3 buffer as code only.

- **Production-grade AWS** per §12: database safety settings, a read-only plan workflow, a pre-deploy snapshot, a migration gate, alarms and a budget alert.
- **Storage:** an S3 storage adapter, now that it can be tested for real. Existing local photos and documents are migrated, not re-uploaded.
- **Email:** Amazon SES with the domain verified (SPF, DKIM, DMARC), plus an adapter. Without it, magic links and notifications land in spam.
- **Auth hardening:** rate limiting on login, signup, lead, prescreen and application endpoints; email verification; password reset; secure headers and a content security policy.
- **Legal sign-off:** the attorney reviews the application, criteria, adverse-action notice, privacy policy and terms. Add a privacy policy, terms, and an Equal Housing Opportunity statement to the public site.
- **Share and discovery (old 1.3):** OG/Twitter metadata using the stored share image (not `next/og` unless Next is on 16.3.8 or later), `metadataBase` from an `APP_URL` env var, canonical URLs, `sitemap.ts`, `robots.ts`, slug URLs, and the QR code on the flyer. `?src=<channel>` links return so channel performance is tracked.
- **Home page:** replace "coming soon" with an "Available homes" page for the domain.
- **DNS:** apex and `www` pointed at the new load balancer per the infra README; turn off Porkbun's URL forwarding. The ACM certificate survives from the earlier stack.
- **Dress rehearsal 3:** a fake listing and fake applicant on the real domain, then enter the real property and real photos.
- **Done when (M3, Jan 24):** smoke test passes against the production domain, a backup restore has been tested, and legal sign-off is recorded.

## 7. Stage 5 — Lease and first money (Feb 1 – Feb 28, target Feb 22)

Built while ads run. Must be ready before the first lease signing.

- **Lease generation by template merge, not freeform generation.** An attorney-reviewed Pennsylvania whole-house lease; the app fills merge fields (parties, property, term, rent, due date, fees, deposit, pets, utilities — much of which is already modeled) and never writes legal text itself. Landlord is Brian by legal name. Versioned templates; PDF output.
- **Lead-paint disclosure — gate 2 of 2:** the lease cannot be sent for signature until the disclosure addendum is attached and the compliance checklist shows the required items.
- **E-sign:** in-app signing with an audit trail (consent to electronic records, signature, timestamp, IP, user agent, SHA-256 of the document, signed PDF stored). A short spike compares this against an external e-sign service; the attorney confirms the approach.
- **`Lease` record** (property, tenants, term, rent, due day, deposit, status) becomes the anchor for payments, maintenance and renewals.
- **Move-in condition report** with photos on the storage adapter — it settles deposit disputes later.
- **Deposit and first month's rent:** Brian's own **individual Stripe account** using Checkout and bank debit (ACH), with a processor-agnostic `Charge`/`Payment` ledger and a webhook route (which is why this stage needs the public environment). **Stripe Connect is deferred** until there is a second landlord. Pennsylvania security-deposit rules go to the attorney.
- **Interim fallback:** external e-sign and manual ledger entries for check/Zelle — the ledger works whichever way money arrives.
- **Done when (M5):** a fake lease for a fake tenant is generated, signed with the disclosure attached, and a deposit is collected in Stripe test mode.

## 8. Stage 6 — Tenant operations (Mar 1 →)

- **Tenant portal** (magic-link): view the lease, pay rent, submit and track maintenance requests. Likely a new `TENANT` role.
- **Recurring rent:** due-date charges, reminders, late fees per the lease, ledger statements. Needs scheduled jobs — a decision made then (an Inngest-style service vs a scheduler calling a protected endpoint), since a single ECS task is a poor place for an in-process timer.
- **Maintenance:** `MaintenanceRequest` with category, urgency, photos, a message thread, and statuses (open → scheduled → done). Landlord notes, vendor details and cost. Email notifications. Wording must not promise 24/7 response.
- **Renewals:** reminders and rent-increase notice timing — outline only; Pennsylvania notice rules go to the attorney.
- **Done when (M6):** a tenant logs in, pays test rent, and submits a request with a photo that the landlord resolves.

## 9. Where to post (channels) — free or easy first

Zillow's feed is deferred (§13), but **manual posting is a different thing and stays available.** Everything below is posted
by hand from the channel kit. Cost and policy claims come from the sources noted — **verify each at sign-up**.

**Decision: TurboTenant and Avail are not used** (nor Apartment List, which a roundup says charges $359 per lease for 1–10 units). Every inquiry
lands in one place Brian controls.

### Launch set — free, post by hand (Feb 1)

| Channel                                            | Cost                                                                                                                                             | Effort and notes                                                                                                                                                                                                                                   |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Zillow Rental Manager** (manual entry, not feed) | Free for individual landlords (roundups)                                                                                                         | One form, broadest reach: roundups say it also lists on Trulia and HotPads. Cheat sheet in the kit.                                                                                                                                                |
| **Craigslist Pittsburgh**                          | **Free.** Craigslist's own fee page says owner-posted apartment rentals are free except in Boston, Chicago and NYC ($5); Pittsburgh isn't listed | Quick text-and-photos form. High volume and scam traffic; never automate posting.                                                                                                                                                                  |
| **Facebook Marketplace** (Property Rentals)        | Free                                                                                                                                             | Quick form, strong local reach.                                                                                                                                                                                                                    |
| **Zumper**                                         | Free for owners with fewer than 10 properties; large metros cap free listings at 5 per account (roundup). One property is fine                   | One form. Per the roundup it also appears on PadMapper, WalkScore and **Facebook Marketplace** — so skip a separate Marketplace post if Zumper's syndication shows up there, to avoid duplicates. Listings expire after 45 days and need renewing. |

### Next — also free, more effort or narrower audience

| Channel                                                                       | Cost                  | Effort and notes                                                                                                           |
| ----------------------------------------------------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Neighborhood Facebook groups** (Lawrenceville and Pittsburgh rental groups) | Free                  | Best fit for a character home. Each group has its own admin rules — read them first; some require approval before posting. |
| **Yard sign / flyer**                                                         | Printing cost (small) | Strong for a house you own on the street. Flyer in the kit.                                                                |

### Check later — unverified, low priority

- **PAHousingSearch.com:** a 2011 Pennsylvania Realtors post says Realtors and property managers can list free, and doesn't say whether individual owners can. Whether it still operates is unknown.
- **RentHop, AffordableHousing.com:** roundups call them free; neither has been checked.
- **Apartments.com:** a basic free tier was claimed by weak sources; paid placements run $20–$199. Not verified, skip unless confirmed.
- **Your real estate agent's MLS listing:** costs money (the agent's fee — ask what it would be); a broker listing may also reach the big portals (unverified here). Not free, so not in the launch set — a fallback if the free channels are quiet.

**Suggested launch order:** Zillow Rental Manager, Craigslist, Facebook Marketplace and Zumper on Feb 1 (about 15 minutes each with the kit),
the Facebook groups that week, and the yard sign when the photos are done. After two weeks of `Lead.source` data, drop whatever isn't producing.

## 10. Pittsburgh compliance and legal help

**Not legal advice. Confidence is labeled.**

| Item                          | What I found                                                                                                                                                                                                                                                                                                                                      | Confidence                                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Property facts                | Allegheny County assessment record: single-family, semi-detached, built **1900**, 9th Ward (other details are entered through the app, not tracked here)                                                                                                                                                                                          | **Public record**; verify against what you know                                                                    |
| Federal lead disclosure       | Pre-1978 rentals: disclose known lead hazards, provide the EPA information, include the Lead Warning Statement in the lease. **Applies to this house (built 1900)**                                                                                                                                                                               | **Confirmed** (Allegheny County Health Department page) plus the county year-built                                 |
| City **rental permit**        | **Brian's real estate agent says no permit is needed.** What I found points the other way: Pittsburgh code says no one may lease or allow occupancy of a rental unit without a valid rental permit, and a 2022 summary says the registration covers all rental owners except owner-occupied dwellings. I could not find a single-family exemption | **Conflicting** — I could not open the code itself (403), and I don't know which exemption the agent is relying on |
| Inspection and lead dust wipe | A 2022 community-group summary says permit properties get a City inspection and, if pre-1978, a **lead dust wipe inspection**. Likely tied to the permit                                                                                                                                                                                          | **Unverified and dated**                                                                                           |
| City lead-safety law          | Council passed a lead bill on Dec 1, 2021 covering pre-1978 rentals. Property-management blogs say the program launched Dec 19, 2024 with **registration voluntary and enforcement on hold** after a landlord-association legal challenge, fines up to $500 per unit once enforced                                                                | **Unverified** — secondary, commercial sources only                                                                |

**On "no permit needed":** this is recorded as your real estate agent's view, and the compliance tracker holds it as _Not
required — per real estate agent_. It conflicts with what I could find. The agent may be right, or may be thinking of a
different permit; an agent is neither the City nor an attorney, and the City is who issues fines. Two cheap ways to close it:
**ask the agent which exemption they are relying on**, and/or **send one email to the City's Permits, Licenses and Inspections
office asking for a written answer** on whether a rental permit or lead inspection is required to rent this house to a
tenant in March, then attach it to the tracker. If the City says none is required, the item is closed and the answer is on file.

**Ownership in your own name.** Recorded as decided. It is the simpler setup, and it means personal liability instead of an
entity's. Ask the attorney whether an LLC makes sense for later houses, and ask your insurance agent about landlord coverage
and an umbrella policy — the usual companion to owning a rental personally. The app doesn't care either way.

### Finding an attorney (you have none)

- **Start with your real estate agent:** ask for two or three landlord-tenant attorney names — agents usually know them.
- **Backup: Allegheny County Bar Association Lawyer Referral Service** — 412-261-5555, [acbalrs.org](http://www.acbalrs.org/). Per its listing: attorneys are pre-screened, carry liability insurance and have an Allegheny County office; you're referred on a rotating basis and entitled to a half-hour consultation (**confirm the current fee**). Ask for a landlord-tenant attorney.
- **Ask for flat fees.** A search summary puts flat-fee lease reviews at roughly **$300–$800** and hourly rates at **$200–$500** — a rough range, not a quote. Get 2–3 quotes against the brief in §17.
- **Timing:** Brian makes the call by Oct 18, engage by Nov 15, first review (criteria, application, adverse-action notice, privacy policy and terms) in December, lease and go-live sign-off in January.

## 11. End-to-end map for the test property

The rule: **every step has somewhere to record state from day one** (status + notes + attached documents), even when the
app doesn't automate it yet. That makes the app the system of record for the real process while it grows.

| #   | Step                                   | App support                                     | Interim until native                                                                             | Stage |
| --- | -------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----- |
| 1   | Legal-to-rent prerequisites            | **Tracked** (compliance checklist + documents)  | —                                                                                                | 1     |
| 2   | Listing content (story, rooms, photos) | **Native**                                      | —                                                                                                | 1     |
| 3   | Distribution                           | **Assisted** (channel kit, photo zip, flyer)    | Post by hand                                                                                     | 1     |
| 4   | Inquiries from every channel           | **Native** (manual entry + source; public form) | —                                                                                                | 1, 4  |
| 5   | Showings                               | **Tracked** (lead status + date + notes)        | —                                                                                                | 1     |
| 6   | Prescreening                           | **Native**                                      | Ask by email/text; record answers in lead notes                                                  | 2     |
| 7   | Application, consent, lead disclosure  | **Native**                                      | External form or PDF; **lead disclosure still must be signed before the lease**                  | 2     |
| 8   | Tenant screening                       | **Tracked** (outcome + report stored)           | SmartMove used directly (§13): free account, invite the applicant, applicant can pay             | 3     |
| 9   | Decision + adverse-action notice       | **Native**                                      | Template letter. If you deny based on a screening report, the FCRA notice is a legal requirement | 3     |
| 10  | Lease, signed disclosure, move-in      | **Native** (template merge, in-app e-sign)      | Attorney-reviewed lease signed with an external e-sign tool; app stores the result               | 5     |
| 11  | Deposit and rent                       | **Native** (Stripe + ledger)                    | Manual ledger entries for check/Zelle                                                            | 5, 6  |
| 12  | Maintenance                            | **Native** (tenant portal)                      | Landlord logs requests from email/text                                                           | 6     |
| 13  | Renewal                                | **Assisted** (reminders)                        | Calendar                                                                                         | 6     |

## 12. Domain, URL and hosting

**Settled:** `brickandbeamrentals.com` is the production URL, and hosting is **AWS upgraded to production grade, deployed in
January and not before.**

**Current state (checked read-only, nothing on AWS touched):** the domain is registered at Porkbun with DNS at Porkbun.
The apex has no record, and `www` is a CNAME to an AWS load-balancer hostname that **no longer resolves** — consistent with
the Teardown having run. The domain is dark. (I can't see AWS itself from here; DNS is only a strong hint.)

**Free win now:** Porkbun includes **free email forwarding** — up to 20 aliases per domain, no wildcard. Create
`leasing@brickandbeamrentals.com` forwarding to your Gmail and use it on every ad, flyer and the listing page. Replies go
out from your personal address unless you add hosted email later; sending _from_ the alias (and app notifications) goes
through SES at Stage 4.

Alternatives considered and set aside: a cheaper non-AWS host (new deploy work on a tight schedule) and a tunnel from the
Mac (laptop must stay on, tenant records and screening reports on a laptop, custom domain likely needs Cloudflare DNS).

### What production grade means, and what it costs

All figures are **my estimates from AWS list prices for `us-west-2`**. I confirmed only the RDS micro hourly rate ($0.016/hour)
from a search; the rest come from my knowledge of AWS pricing. **Check them in the AWS Pricing Calculator before January.**

**Today's config, running ≈ $52/month:**

| Piece                                                                                        | ≈ per month |
| -------------------------------------------------------------------------------------------- | ----------- |
| RDS `db.t4g.micro`, single-AZ                                                                | $11.70      |
| RDS storage, 20 GB gp3                                                                       | $2.30       |
| Application Load Balancer (base + light traffic)                                             | $17         |
| Fargate task, 0.25 vCPU / 0.5 GB, one task (1 GB recommended for photo conversion — see 1.1) | $9          |
| Public IPv4 addresses (2 for the ALB, 1 for the task) × $3.65                                | $11         |
| Logs, SSM parameters, ECR, certificate                                                       | $1          |
| **Total**                                                                                    | **≈ $52**   |

The infra README says ≈ $38–45; I think it leaves out the public-IPv4 charges AWS began billing in 2024. **Budget ≈ $52, and
check Cost Explorer after the first month.**

**Production-grade essentials — ≈ +$3/month, ≈ $55 total. Confirmed by Brian (Oct 4): essentials only.** These are what Issue L needs:

| Change                                                                                                                     | ≈ extra per month                                     |
| -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Backups kept 14 days instead of 3 (RDS allows up to 35)                                                                    | $0 — backup storage up to the DB size is free         |
| `deletion_protection = true` plus Terraform `prevent_destroy` on the database                                              | $0                                                    |
| Encrypted storage at rest, AWS-managed key. Set on the **fresh** January database — it can't be switched on in place later | $0                                                    |
| Final snapshot on destroy, plus a snapshot before every deploy, keeping the last 3                                         | ≈ $0–1 (billed only beyond the free backup allowance) |
| About 6 CloudWatch alarms (DB CPU/storage/connections, ALB 5xx, unhealthy targets, no running task), emailed               | ≈ $0.60                                               |
| AWS Budgets alert at $60/month                                                                                             | $0 (first budgets are free)                           |
| S3 bucket for photos and documents (private, encrypted, versioned)                                                         | < $1 at a few GB                                      |
| SES for app email, domain verified                                                                                         | ≈ $0.10 per 1,000 emails — pennies at this volume     |

**Workflow safety changes — $0:**

1. **A read-only `plan` workflow.** Deploy runs `terraform apply -auto-approve` on both stacks with no preview, and Terraform isn't installed on this Mac and there are no local AWS credentials, so a preview has to run in GitHub Actions. No infra change is applied without a plan reviewed first.
2. **A pre-deploy snapshot step** in Deploy.
3. **A migration gate:** migrations run _before_ the service update, and once tenant data exists they must be backward-compatible. Today they run alongside the rolling deploy (the workflow comments say so).
4. **A split Teardown:** app-only teardown stays easy; database teardown is blocked by deletion protection and `prevent_destroy` and needs deliberate manual steps. Once a tenant is live, "pause AWS to save money" is no longer an option.

**Optional extras — decided against for now (Brian, Oct 4):**

| Extra                                                 | ≈ extra per month | Why not now                                                                                                 |
| ----------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------- |
| Multi-AZ database (doubles instance and storage)      | +$14              | Protects against an AZ outage. Backups plus a tested restore cover a single rental.                         |
| Second Fargate task (zero-downtime deploys, failover) | +$13              | A rolling deploy of one task causes a brief blip. Revisit once a tenant pays through the app.               |
| AWS WAF (web ACL + a few rules)                       | +$7–10            | In-app rate limiting comes first.                                                                           |
| Private subnets with a NAT gateway                    | +$33              | The database isn't publicly reachable and its security group admits only the app, so the exposure is small. |
| Larger database (`db.t4g.small`)                      | +$12              | Only if the app proves slow.                                                                                |
| **Everything above**                                  | **≈ +$80**        | Total ≈ $135/month. Not recommended.                                                                        |

**Through March:** deploying Jan 4 and running to Mar 31 is about 2.9 months, so **≈ $160 at the $55 tier**, or ≈ $660 a year.

## 13. Zillow feed and SmartMove API: deferred

**Zillow rentals feed — deferred by Brian.** Findings kept for when it is revisited: Zillow's own page says the program is
for "a property management company or a property management system", requires an approved request **before any work
begins**, then a testing phase that "typically takes 4-6 weeks" on production data. Formats: XML per the Rental Listings Feed
Guide, or MITS. A separate Lead API exists. The page says nothing either way about individual landlords; third-party
summaries claim individuals and non-PMS software don't qualify — unconfirmed.

- Zillow tests with production data, so it only becomes possible after Stage 4.
- The Feed Guide is not public. Do not build a generator against a spec we haven't seen; the Zillow-shaped schema stays as-is.
- Nothing to do now. The intake request (4–6 week clock) can be submitted after go-live if the feed is still wanted.

**SmartMove — API not needed for the test case.** SmartMove's own site says individual landlords can sign up free (no setup
fees or minimums), invite the applicant by email, and choose who pays. A roundup quotes $25 per screening (**verify**).
Use it by hand for the real applicants and record the outcome in the app (step 8). The API/partner route only matters for
automating this later.

## 14. Dependencies and what costs money

### Libraries — all free

Free, open source, no accounts, no fees. Licenses checked against the npm registry.

| Package            | What it does                                                                                                                  | License    | Cost     | Needed by |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ---------- | -------- | --------- |
| `sharp`            | Image processing: resize, auto-rotate, strip location data, convert formats. Powers the photo pipeline                        | Apache-2.0 | **Free** | Stage 1.1 |
| `zod`              | Validates structured form data (rooms, application sections) and gives it types                                               | MIT        | **Free** | Stage 1.2 |
| `vitest`           | Test runner for logic and server code. Dev only                                                                               | MIT        | **Free** | Stage 0   |
| `@playwright/test` | Drives a real browser to test whole flows (sign up → list → inquire). Dev only. Downloads browser binaries (a few hundred MB) | Apache-2.0 | **Free** | Stage 0   |
| `fflate`           | Tiny zip library: builds the "download all photos" file                                                                       | MIT        | **Free** | Stage 1.4 |
| `qrcode`           | Generates QR codes for the flyer                                                                                              | MIT        | **Free** | Stage 4   |

PDF generation (lease, adverse-action notice), the Stripe SDK and scheduled jobs are Stage 3–6 choices, each decided with a
short spike when its stage starts. They are expected to be free libraries; Stripe's cost is processing fees, below.

### Free services already in use or planned

Mapbox free tier (100k requests/month, per `.env.example`); Porkbun email forwarding; Craigslist, Zillow Rental Manager,
Facebook Marketplace and Zumper for an individual owner (see §9 for the caveats); GitHub Actions for CI; SmartMove sign-up (you pay only per screening, and the
applicant can pay).

### What costs money

| Item                            | Cost                                                                                                                                       | Who pays / when                             | Source                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- | ----------------------------------------- |
| **AWS hosting**                 | ≈ **$55/month** at production-grade essentials; ≈ $52 as it stands today. **$0 until the January deploy**                                  | You, from Jan 4. ≈ $160 through March       | My estimate from list prices (§12)        |
| **Attorney reviews**            | Flat-fee lease review roughly **$300–$800**; hourly **$200–$500**. Expect several reviews (§17). Half-hour referral consult — confirm fee  | You, one-time, Dec–Jan                      | Search summary — rough range, not a quote |
| **Photo-conversion memory**     | Raise the Fargate task from 0.5 GB to 1 GB (recommended after the 1.1 spike): ≈ **+$1.60/month**                                           | You, from Jan                               | My estimate from Fargate list prices      |
| **SmartMove screening**         | About **$25 per applicant**; the applicant can pay                                                                                         | Applicant (default) or you, per applicant   | Roundup — verify                          |
| **Stripe — bank debit (ACH)**   | **0.8%, capped at $5** per payment                                                                                                         | Deducted from each rent payment             | Fee roundups — verify at setup            |
| **Stripe — card**               | **2.9% + 30¢** per payment                                                                                                                 | Deducted from each payment                  | Fee roundups — verify at setup            |
| **Amazon SES (app email)**      | ≈ **$0.10 per 1,000 emails** (AWS also launched bundled plans in July 2026 at higher per-email rates; the pay-as-you-go rate still exists) | You — pennies                               | AWS announcement and pricing roundups     |
| **Domain renewal**              | Porkbun's current renewal price for `.com` (visible in your account)                                                                       | You, annually                               | Not looked up                             |
| **Printing** (flyer, yard sign) | Small; local print-shop quote                                                                                                              | You, once                                   | Not looked up                             |
| **Hosted email for the domain** | Optional. Forwarding is free; a hosted mailbox costs extra                                                                                 | You, only if you want to send as `leasing@` | Not looked up                             |

**Worked example — rent of $2,000:** ACH costs $5 (0.8% would be $16, so the cap applies); a card payment costs $58.30. Whether to offer
card payments at all, and who bears the fee, is a Stage 5 decision with the attorney (surcharge rules).

**Nothing else in this plan costs money.** The remaining unknowns are the attorney quotes, the domain renewal and printing; I'll
replace them with real numbers when you have them.

## 15. Risks

| Risk                                                                               | Mitigation                                                                                                                                                                                       |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Schedule:** 17 weeks to cover Stages 0–4, then Stage 5 under live pressure       | Native-by-when split, interim column (§11), and the cut order in §0. Weekly check against the milestones                                                                                         |
| **No attorney yet**, and three review points depend on one                         | Brian is making the referral call by Oct 18 (agent referral first); engage by Nov 15. Without a lawyer the applicant, adverse-action and lease features can't ship                               |
| "No permit needed" can't be reconciled with what I found                           | Ask the agent which exemption applies, and/or one email to the City for a written answer, attached to the compliance tracker. If wrong, the cost is a fine and a delayed lease                   |
| City lead-law status is unclear and may change                                     | Compliance rules are data, not code; re-verify before each new listing                                                                                                                           |
| An infra edit replaces the database (some RDS setting changes do) once data exists | Deletion protection + `prevent_destroy`, plus a read-only plan workflow reviewed before every apply                                                                                              |
| Real data lands in the dev-grade database                                          | Issue L fixes are Stage 4 entry conditions; January starts from a fresh, encrypted database                                                                                                      |
| Personal liability from owning in Brian's own name                                 | Attorney and insurance-agent conversations (§10); not an app concern                                                                                                                             |
| Applicant PII (income documents, screening reports)                                | No SSN or ID images in the app; screening reports stay in SmartMove with the outcome copied in; retention schedule from the attorney                                                             |
| Lease, e-sign or payments take longer than February allows                         | Stage 5 interim fallbacks: external e-sign, manual ledger entries                                                                                                                                |
| Photo conversion starves the small container                                       | Spiked: 7–14 s and ≤ 283 MB per 12-megapixel photo at 0.25 vCPU. Convert one photo at a time, limit input pixels, raise the task to 1 GB (≈ +$1.60/month)                                        |
| Floor plans or room dimensions are read as exact                                   | Required "Approximate — not to scale" label on every plan; dimensions optional                                                                                                                   |
| "Known conditions" wording creates liability or alarm                              | Optional fields; "Not sure" is never shown; the attorney decides wording (§17)                                                                                                                   |
| HEIC photos fail through `sharp`                                                   | Confirmed: the server cannot decode HEIC. Restrict `accept`, detect HEIC by its first bytes and explain how to export JPEG; verify iPhone behavior on a real device (`scripts/heic-device-test`) |
| Photos aren't ready by Feb 1 (for example, the property is occupied until March)   | Real photos are needed for the January data entry; this is Brian's logistics, not an app task                                                                                                    |
| Fair Housing linter gives false confidence                                         | Advisory only; wording says so; attorney's sanity check before it ships as guidance                                                                                                              |
| Scope creep from "unique properties" into a general rental marketplace             | Whole-house focus in §0; multi-unit gets no new investment                                                                                                                                       |

## 16. Action items and decisions

**Brian's action items**

1. **Attorney, by Oct 18:** ask your real estate agent for landlord-tenant attorney names, with the Lawyer Referral Service as backup. Get 2–3 flat-fee quotes against §17. Everything legal in Stages 2–5 depends on it.
2. **Permit, this month:** ask the agent which exemption they are relying on, and/or email the City for a written answer (§10).

**Decided — no longer open**

- Property details are entered through the app's own forms, not collected in this plan.
- AWS production-grade essentials (≈ $55/month), no optional extras; nothing deploys before January (§12).
- Free or easy channels first, and no syndication services (§9).
- Individual ownership, no LLC (§0).

**Next:** Stage 0 starts when Brian says go.

## 17. Attorney brief — what to ask quotes for

One short email to 2–3 attorneys. Ask for a flat fee per item, or one bundled fee.

1. **Lease:** review or draft a Pennsylvania residential lease for a whole-house, single-family rental in Pittsburgh, with the federal lead-based paint disclosure addendum for a house built in 1900. Cover security-deposit limits and handling, late fees, notice requirements, utilities, pets, and anything Pittsburgh-specific. The app fills fields into your text; it never edits the legal wording.
2. **Applications:** review the rental criteria, prescreen questions, application and consent language, and the FCRA adverse-action notice.
3. **Advertising:** a sanity check of ad language against Fair Housing rules, and of the advisory copy-check wording in Stage 1.4.
4. **Website:** privacy policy and terms of use for a site that collects applicant and tenant information.
5. **Electronic signing:** whether in-app e-signature with an audit trail is acceptable for a residential lease, and how long to retain signed documents and applicant records.
6. **Questions:** does Pittsburgh require a rental permit or lead inspection for this house (and get that in writing); what is the status of the City's lead ordinance; and is an LLC worth considering for later houses.
7. **Known conditions:** which conditions the listing should state and how (lead water line, asbestos, past water intrusion or mold, radon results, knob-and-tube wiring), and whether the floor-plan "approximate" label is enough.
