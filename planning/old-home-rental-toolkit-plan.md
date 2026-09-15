# Old-Home Rental Toolkit — Product & Build Plan

**Owner:** Brian Quaresma
**Status:** Pre-build planning
**Last updated:** September 15, 2026

## 1. Vision

A landlord toolkit built specifically for one-of-a-kind older homes in desirable, walkable urban
neighborhoods — not apartments, not tract housing. Covers the full lifecycle: list → find tenant →
screen → lease → collect rent → manage requests. Free-to-landlord core, monetized on the applicant side.

**Why this niche wins:** Generic tools (TurboTenant, Avail, RentRedi, Buildium) are built around
filterable specs — bed/bath/sqft/amenities grids — which undersell a character property and mishandle
its actual compliance profile. No incumbent owns "old house rental." The whitespace is real, not just
positioning.

## 2. Target Customer

| Attribute    | Definition                                                                                                                                                                        |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Who          | Self-managing landlord, 1–10 doors, owns pre-1978 character properties (rowhouses, Victorians, converted multi-units)                                                             |
| Where        | Walkable, historic-adjacent urban neighborhoods (e.g., Lawrenceville/Bloomfield Pittsburgh, Baltimore rowhouse neighborhoods, similar Rust Belt/legacy-city markets)              |
| Not who      | Large PM portfolios, new-construction multifamily, suburban tract-home landlords                                                                                                  |
| Brian's edge | Owns a pre-1978 Pittsburgh property, actively evaluating Baltimore/Cleveland — built-in first beta property and realistic user-interview access before needing outside validation |

## 3. Competitive Landscape

| Player                                                     | Model                                      | Gap for this niche                                                                |
| ---------------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------- |
| TurboTenant / Avail / RentRedi / Innago                    | Free-to-landlord, applicant-paid screening | Generic listing schema, no character/story field, no lead-paint-specific workflow |
| Buildium / AppFolio                                        | Full PM suites                             | Built for portfolios, not solo landlords; overkill and expensive                  |
| Zillow Rental Manager                                      | Free basic listings, ~34M monthly visitors | Largest free audience — use as a channel, not a competitor                        |
| Circa Old Houses (and similar)                             | Historic home marketplace                  | Sale only, not rental — no direct competitor on the rental side                   |
| Syndication tools (Reallyo, Landlord Studio, RentecDirect) | Post once, push to multiple portals        | Useful as a distribution layer, not a product differentiator                      |

**Market note:** Zillow became the exclusive listing provider for larger multifamily buildings (25+
units) across Redfin, Rent.com, and ApartmentGuide.com in early 2025 — under FTC/state antitrust
scrutiny. Irrelevant to your persona (small/solo landlords aren't affected), but confirms the strategic
point: **own your listing data and your own site as the source of truth**, treat portals as
distribution.

## 4. Product Phases

### Phase 0 — Validate (1–2 weeks)

- Confirm the persona and pain-point priority (finding/screening tenants) against 5–10 real
  conversations, ideally within Brian's own Pittsburgh/Baltimore/Cleveland network.
- Confirm the "free listing everywhere" promise is honest: Zillow basic tier is free; most others are
  not. Don't oversell.

### Phase 1 — MVP: Find & Screen

**Core loop:** list → lead → application → screen → decide.

| Feature                                                        | Notes                                                                                                                                                    |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Property/unit setup                                            | Address, rent, photos, availability, lease terms                                                                                                         |
| Character-forward listing builder                              | Narrative/story block as first-class field; flexible layout schema for non-standard rooms (converted attic, carriage house unit, non-conforming bedroom) |
| Public listing page                                            | Shareable URL — this is the durable asset, independent of any portal                                                                                     |
| Zillow Rental Manager feed integration                         | Primary free distribution channel                                                                                                                        |
| Manual-export formatting for Craigslist / Facebook Marketplace | Both restrict automated posting by individual landlords — build a "copy-formatted listing" button rather than fighting ToS                               |
| Lead inbox                                                     | All inquiries in one place, regardless of source                                                                                                         |
| Prescreening questionnaire                                     | Income, move-in date, pets, credit range — filters before paid screening                                                                                 |
| Digital rental application                                     | Customizable fields, e-signature on consent                                                                                                              |
| **Lead-based paint disclosure workflow**                       | **Mandatory, non-skippable step for any pre-1978 property — auto-triggered by build year field**                                                         |
| Tenant screening (TransUnion SmartMove)                        | API + webhook (`screening.completed`) integration; applicant pushes own report; applicant-pays option keeps core product free                            |
| Decision workflow                                              | Score against stated criteria; approve/deny/waitlist; auto-generate adverse-action notices                                                               |

### Phase 2 — Payments & Communication

- Rent collection via Stripe Connect (or Plaid + Dwolla for ACH-only)
- Maintenance request intake + status tracking, tied to property record
- Tenant-landlord messaging thread, tied to lease

### Phase 3 — Retention & Expansion

- Lease renewal workflows, state-compliant rent-increase notice timing
- Basic bookkeeping/tax export per property
- Multi-property portfolio view

### Phase 4 — Scale

- Local Realtor-fed rental MLS syndication (relevant to character homes specifically)
- Auto-generated social/share cards per listing (Instagram/Pinterest-style presentation —
  character-home renters over-index on aesthetic discovery channels vs. generic portal search)
- Historic-district renovation/permitting disclosure checklist (market-dependent, e.g., Pittsburgh,
  Baltimore review boards)

## 5. Compliance Requirements

This is a core product feature for this niche, not boilerplate — because the target property set is
disproportionately pre-1978.

### Federal baseline (Title X / Lead-Based Paint Disclosure Rule)

- Required for all pre-1978 rental housing before lease signing or renewal
- Landlord must: disclose known lead-based paint/hazards, provide the EPA pamphlet ("Protect Your
  Family from Lead in Your Home"), retain signed disclosure for 3+ years
- **Penalty exposure: up to ~$19,500 per violation**, plus personal liability (treble damages) if a
  tenant or child is harmed
- Exempt: 0-bedroom housing (studios), leases of 100 days or fewer

### State add-ons (build as jurisdiction-aware logic keyed to city/state + build year)

| State          | Additional requirement                                                                                                            |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Massachusetts  | Lead inspection required before renting to families with children under 6; must delead or apply interim controls if hazards found |
| New York (NYC) | Local Law 1: annual visual inspection for peeling paint in pre-1960 buildings where children under 6 reside                       |
| Maryland       | Lead-safe registration + periodic inspection required for pre-1978 rentals                                                        |
| Rhode Island   | Lead-safe certification with mandatory inspections                                                                                |

### Other standing compliance items (not niche-specific, still required)

- **FCRA** — permissible-purpose and adverse-action rules apply regardless of screening vendor;
  liability stays with the landlord
- **Fair Housing Act** — application forms and any auto-scoring logic must not create disparate impact
  on protected classes; legal review before launch, not after
- **Screening data limits vary by state** — e.g., SmartMove only returns criminal records in 30 states

## 6. Tech Architecture

| Layer                | Choice                                                 | Rationale                                                                            |
| -------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Frontend/backend     | Next.js (App Router)                                   | Single codebase for marketing site + app, fast solo iteration                        |
| Database             | Postgres (local Docker for dev; AWS RDS in production) | Relational model fits leases/applications/payments                                   |
| Auth                 | Auth.js (NextAuth), multi-tenant from day one          | Landlord, applicant/tenant, future team-member roles                                 |
| Payments             | Stripe Connect                                         | Each landlord = connected account; Stripe absorbs most PCI/compliance burden         |
| Screening            | TransUnion SmartMove API                               | Established, FCRA-compliant, applicant-pays option available                         |
| Listing distribution | Zillow feed integration first                          | Manual-export for Craigslist/Facebook until volume justifies syndication partnership |
| File/photo storage   | TBD (S3-compatible, AWS-aligned)                       | Deferred until Phase 1 listing builder needs it                                      |
| Background jobs      | Inngest or BullMQ                                      | Needed for screening webhooks, rent reminders, renewal triggers                      |

> Note: production infra is standardizing on AWS (RDS for Postgres) rather than the
> Supabase/Neon/Cloudflare R2 options considered earlier — local development still uses a
> throwaway Postgres via Docker Compose.

## 7. Monetization

| Model                    | Mechanics                                                             | Recommendation                                               |
| ------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| Applicant-paid screening | Landlord free, applicant pays SmartMove fee                           | Start here — matches category norm, lowest adoption friction |
| Freemium SaaS            | Free for 1 unit, paid tiers by unit count                             | Add once portfolio-management features (Phase 3) exist       |
| Payment processing fee   | Small % or flat fee on rent collection                                | Defer to Phase 2                                             |
| Listing boost fee        | Pass-through cost for premium portal placement (e.g., Apartments.com) | Optional add-on, doesn't compromise free core promise        |

## 8. Go-to-Market

- **Seed customer:** Brian's own Pittsburgh property — first real listing, first real compliance test,
  first real screening cycle.
- **Early network:** Landlords in Pittsburgh/Baltimore/Cleveland rowhouse and historic-district circles
  — direct overlap with Brian's own property search activity.
- **Channel-market fit:** Neighborhood Facebook groups, Nextdoor, local Realtor-fed rental feeds —
  these outperform generic portal search for character-home renters and are underused by incumbents.
- **Positioning line to test:** "Built for landlords of homes that don't fit a template" —
  differentiate explicitly against the bed/bath/sqft grid model.

## 9. Risks & Open Questions

| Risk                                      | Mitigation                                                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| "Free everywhere" promise overreach       | Be explicit: free where Zillow's basic tier applies; manual-assist elsewhere; paid boost optional |
| FCRA/Fair Housing liability               | Legal review of application forms and scoring logic before first real applicant                   |
| Lead disclosure skipped by landlord users | Make it a hard gate in the lease flow, not an optional checkbox                                   |
| Niche too small to sustain a business     | Validate in Phase 0 before scaling past Pittsburgh/Baltimore/Cleveland-type markets               |
| Solo build bandwidth vs. scope            | Hold the line on MVP feature list — Phase 2/3 items are explicitly deferred, not "if time allows" |

## 10. Immediate Next Steps

1. Lock Phase 1 scope (table in Section 4) — no additions before it ships.
2. Confirm SmartMove API access and Zillow Rental Manager feed documentation — both integrations gate
   architecture decisions.
3. Get informal Fair Housing / FCRA review of application and scoring logic.
4. Draft the jurisdiction-aware lead-disclosure compliance checklist (federal + MA/NY/MD/RI variants
   above) as a standalone reference doc.
5. Stand up Next.js + Postgres skeleton with landlord auth and property CRUD, including the
   character-forward listing schema.

## 11. Repo & Build Workflow

- Source of truth repo: [bquaresma/brickandbeam](https://github.com/bquaresma/brickandbeam)
- Local dev: Postgres via Docker Compose; production target is AWS RDS
- This planning doc lives at `planning/old-home-rental-toolkit-plan.md` in the repo so Claude Code (or
  any future collaborator) has full context before scaffolding or extending the app.
