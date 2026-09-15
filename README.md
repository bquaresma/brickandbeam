# Brick and Beam

A landlord toolkit for one-of-a-kind older homes (pre-1978 character properties) in walkable
urban neighborhoods. See [`planning/old-home-rental-toolkit-plan.md`](planning/old-home-rental-toolkit-plan.md)
for the full product plan.

This repo currently holds the **Phase 1 skeleton**: landlord auth, and property/unit/listing CRUD.
No public listing page, Zillow feed integration, screening, or payments yet.

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
then add properties and units from `/dashboard`.

## Useful scripts

| Script                 | What it does                           |
| ---------------------- | -------------------------------------- |
| `npm run dev`          | Start the dev server                   |
| `npm run build`        | Production build                       |
| `npm run lint`         | ESLint                                 |
| `npm run format`       | Format with Prettier                   |
| `npm run format:check` | Check formatting without writing       |
| `npm run db:migrate`   | `prisma migrate dev`                   |
| `npm run db:studio`    | Open Prisma Studio (visual DB browser) |

## Data model

- **User** — landlord/applicant/team-member (role-based; only `LANDLORD` is used today), plus the
  standard Auth.js `Account`/`Session`/`VerificationToken` tables
- **Property** — address + `buildYear`. `buildYear < 1978` drives the federal lead-based paint
  disclosure gate (see `src/lib/compliance.ts`)
- **Unit** — belongs to a Property; supports non-standard layouts via optional `bedrooms`/
  `bathrooms`/`squareFeet` plus freeform `layoutNotes` and a flexible `rooms` JSON field for
  future structured room data
- **Listing** — one per Unit, with a first-class `story` narrative field and a `DRAFT`/
  `PUBLISHED`/`ARCHIVED` status. Landlord-side CRUD is built (`/dashboard/properties/[id]/units/
  [unitId]/listing/new` and `/edit`); there's no public listing page yet (Phase 1 next step)

## Auth notes

- Credentials provider (email + password), hashed with `node:crypto` scrypt — no extra password
  hashing dependency
- Session strategy is JWT (required for the Credentials provider)
- `src/lib/auth.config.ts` holds the edge-safe config (used by `src/proxy.ts`, Next 16's
  middleware replacement) and `src/lib/auth.ts` adds the Credentials provider + Prisma adapter,
  which depend on Node APIs and must not be bundled into the edge runtime
- `/dashboard/**` is gated by `src/proxy.ts`; individual server actions in `src/lib/actions/`
  additionally scope every query to the signed-in landlord's own records

## Deployment target

Local dev uses Docker Postgres. Production is planned on AWS, with Postgres on RDS — no RDS
setup here yet, just `DATABASE_URL` pointed at a standard Postgres connection string.
