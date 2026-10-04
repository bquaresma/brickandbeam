# Brick and Beam

A landlord toolkit for one-of-a-kind older homes (pre-1978 character properties) in walkable
urban neighborhoods. See [`planning/old-home-rental-toolkit-plan.md`](planning/old-home-rental-toolkit-plan.md)
for the full product plan.

This repo currently holds the **Phase 1 foundation**: landlord auth, property/unit/listing CRUD, a
public listing page with owner draft preview, and lead capture. No prescreening questionnaire,
rental application, Zillow feed integration, screening, or payments yet. The build order and
schedule live in [`planning/launch-roadmap.md`](planning/launch-roadmap.md).

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Prisma](https://www.prisma.io) + PostgreSQL (local dev via Docker Compose; AWS RDS in production)
- [Auth.js](https://authjs.dev) (NextAuth v5) — credentials-based landlord auth, schema supports
  future applicant/team-member roles
- [Tailwind CSS](https://tailwindcss.com) v4
- ESLint + Prettier (with `prettier-plugin-tailwindcss` for class sorting)

## Setup on a new machine

### 1. Prerequisites

- Node.js 20+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for local Postgres)

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Generate a real `AUTH_SECRET` and put it in `.env`:

```bash
npx auth secret
```

The default `DATABASE_URL` in `.env.example` already matches `docker-compose.yml`, so you
shouldn't need to change it for local dev.

### 4. Start Postgres

```bash
docker compose up -d
```

### 5. Run migrations

```bash
npx prisma migrate dev
```

This applies `prisma/migrations/` and generates the Prisma Client. (`postinstall` also runs
`prisma generate` automatically after `npm install`.)

### 6. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up for a landlord account at `/signup`,
then add properties from `/dashboard` (whole house is the default).

Optional: `npm run db:seed` adds a fictional sample landlord, property, listing and lead
(credentials are printed by the script). `npm run db:reset` rebuilds the dev database from the
migrations and re-seeds it — it **deletes all local data**.

## Useful scripts

| Script                      | What it does                                       |
| --------------------------- | -------------------------------------------------- |
| `npm run dev`               | Start the dev server                               |
| `npm run build`             | Production build                                   |
| `npm run lint`              | ESLint                                             |
| `npm run format`            | Format with Prettier                               |
| `npm run format:check`      | Check formatting without writing                   |
| `npm run db:migrate`        | `prisma migrate dev`                               |
| `npm run db:studio`         | Open Prisma Studio (visual DB browser)             |
| `npm run db:seed`           | Add fictional sample data (idempotent)             |
| `npm run db:reset`          | Rebuild the dev DB from migrations                 |
| `npm test`                  | Unit tests (Vitest)                                |
| `npm run test:e2e`          | Browser smoke test (Playwright)                    |
| `npm run photos:regenerate` | Rebuild every photo's served sizes from its master |

The smoke test uses its own `brickandbeam_test` database (override with `TEST_DATABASE_URL`) and
starts its own dev server on port 3100. First run needs `npx playwright install chromium`.

## Data model

- **User** — landlord/applicant/team-member (role-based; only `LANDLORD` is used today), plus the
  standard Auth.js `Account`/`Session`/`VerificationToken` tables
- **Property** — address + `buildYear` + `neighborhoodBlurb` (shared across every unit's listing at
  that address). Coordinates are geocoded once at save time, and `publicContactEmail` is the
  address shown publicly (the landlord's sign-in email never is). `buildYear < 1978` drives the federal lead-based paint disclosure gate (see
  `src/lib/compliance.ts`)
- **Unit** — belongs to a Property; supports non-standard layouts via optional `bedrooms`/
  `bathrooms`/`squareFeet` plus freeform `layoutNotes` and a flexible `rooms` JSON field for
  future structured room data. Also carries `dateAvailable`, `isFurnished`, `smokingAllowed`,
  and `parkingType`, plus related `Amenity`, `PetPolicy`, `Fee`, and `Utility` records — all
  managed from `/dashboard/properties/[id]/units/[unitId]/details`
- **Listing** — one per Unit, with a first-class `story` narrative field, a short `previewMessage`
  teaser, `leaseTerm`, `virtualTourUrl`, `heroPhotoUrl`/`floorPlanUrl` (plain URLs for now — no
  upload pipeline yet), and a `DRAFT`/`PUBLISHED`/`ARCHIVED` status. Landlord-side CRUD is at
  `/dashboard/properties/[id]/units/[unitId]/listing/new` and `/edit`; published listings are
  publicly viewable at `/listings/[listingId]` (draft/archived return a 404 to everyone except the
  owning landlord, who sees them with a "not public" banner)
- **Amenity / PetPolicy / Fee / Utility** — unit-scoped records shaped to match the field names used
  by Zillow's Rental Listing feed (tag-based amenities, per-pet-type policies, typed fees with
  timing/refundability, per-utility included-vs-tenant-pays), so a future syndication export
  doesn't force a schema rewrite. Full CRUD for all four lives on the unit details page
- **Lead** — an inquiry submitted from a public listing page's contact form (name, email, phone,
  message), scoped to a Listing. `NEW` / `CONTACTED` / `ARCHIVED` status, managed from
  `/dashboard/leads` — a single inbox across every property, with an unread-count badge in the
  dashboard nav

## Brand notes

The public listing page (`/listings/[listingId]`) uses an "Industrial Heritage" palette —
brick red `#9A4635`, aged timber `#6B4A34`, warm plaster `#F3E8D8`, iron charcoal `#262626`,
weathered brass `#B08A4A` (hover states), soft sage `#5f6b52` (amenity tags) — plus the
Spectral serif for headings, scoped to that route via `next/font/google`. The landing,
sign-in/sign-up and dashboard pages use the related "Hearth" palette (`HEARTH` in
`src/components/hearth-page-shell.tsx`): charcoal-brown headings `#3D2E24`, warm taupe body
`#7A5B48`, rust accent `#B1502F`, brass-gold `#C99A4E`.

## Auth notes

- Credentials provider (email + password), hashed with `node:crypto` scrypt — no extra password
  hashing dependency
- Session strategy is JWT (required for the Credentials provider)
- `src/lib/auth.config.ts` holds the edge-safe config (used by `src/proxy.ts`, Next 16's
  middleware replacement) and `src/lib/auth.ts` adds the Credentials provider + Prisma adapter,
  which depend on Node APIs and must not be bundled into the edge runtime
- `/dashboard/**` is gated by `src/proxy.ts`; individual server actions in `src/lib/actions/`
  additionally scope every query to the signed-in landlord's own records

## Production-like stack in Docker

To run the exact image the Deploy workflow builds (standalone production build, non-root user,
migrations as a one-off task first), alongside the same Postgres:

```bash
npm run docker:prod        # docker compose --profile prod up --build
```

It serves at [http://localhost:8080](http://localhost:8080) (so it can run next to `npm run dev`
on 3000) and reads `AUTH_SECRET` and `NEXT_PUBLIC_MAPBOX_TOKEN` from `.env`. It shares the dev
database by default (set `STACK_DATABASE_URL` to point it elsewhere), and uploaded files live in the
`app_storage` volume. Stop just the app with
`docker compose --profile prod stop app`; plain `docker compose up -d` still starts only Postgres.

## Photos

Landlords upload photos on the listing edit page. Each upload goes through
`src/lib/images`: it is checked by its first bytes (JPEG, PNG and WebP are accepted; iPhone HEIC is
not — the server has no HEVC decoder, so the uploader is told how to export a JPEG), rotated,
converted to sRGB, stripped of all metadata including GPS, and stored as a private **master**
(never served). From the master it generates, once:

- a display ladder — 400, 800, 1200 and 1600 px wide in AVIF, WebP and JPEG
- a 1200×630 share crop and a 2048 px JPEG export for the listing-site ad kit
- a tiny blurred placeholder stored on the row

Floor plans use a lossless profile (WebP + PNG, up to 2400 px). Variants are served by
`/media/[...key]` with immutable caching (draft listings: owner only; masters: never) and rendered
as responsive `<picture>` elements. Conversion runs one photo at a time because it is CPU-heavy;
expect roughly 7–14 s per 12-megapixel photo on the small production task. After changing presets
in `src/lib/images/process.ts`, bump `PRESET_VERSION` and run `npm run photos:regenerate`.

## House details (the walk-through)

Each unit has a guided walk-through at `/dashboard/properties/[id]/units/[unitId]/walkthrough`:
rooms with per-floor floor plans, and cards for kitchen, bathrooms, basement, laundry, systems,
character and quirks, known conditions, and outdoors. The questions live in one catalog,
`src/lib/details/catalog.ts`, which drives the forms, the validation (generated into `zod`
schemas in `schema.ts`) and the public listing (`format.ts`). Every question is optional; where a
landlord may not know, the answer is Yes / No / **Not sure**, and "Not sure" is never shown
publicly — it stays on the landlord's page as an open item. Answers are stored as versioned JSON in
`Unit.details` (rooms in `Unit.rooms`); each card saves with an atomic `jsonb_set`, so adding a
question never needs a migration. Floor plans are `ListingPhoto` rows of kind `FLOOR_PLAN`, one per
level (a new upload replaces the old one), shown as "Approximate — not to scale".

## File storage

User files go through the storage adapter in `src/lib/adapters/storage` — the database stores
storage keys, never URLs. `STORAGE_DRIVER=local` (the only driver today) writes under
`STORAGE_LOCAL_DIR` (gitignored).

## Deployment

Local dev uses Docker Postgres. Production infrastructure (Terraform, ECS, RDS) lives in
[`infra/`](infra/README.md); deploys are manual (Actions → Deploy) and nothing deploys on push.
The launch roadmap schedules the first production deploy for January.
