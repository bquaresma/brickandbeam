# Public listing page — mockup

Design source for the first-draft public rental listing page (the page a prospective
renter lands on — not yet built in the app). Published preview:
https://claude.ai/artifact/KCMiqgtZkgF1wfJEDoSQtv

`Main.dc.html` is a Design Component file for Claude Design's canvas editor, not plain
HTML — it won't render correctly opened directly in a browser. Re-open it by pasting the
published link back to Claude, or re-seed it into a fresh canvas from these source files.

Content is built around the seeded example data already in the app: the 1910
Lawrenceville attic suite unit (1.5bd/1ba, 620 sqft, $1,450/mo). Photos are stylized
placeholder illustrations, not real images — everything else (specs, floor plan callout,
appliances, amenities, pet policy, utilities included/excluded, neighborhood blurb,
lead-paint disclosure notice, contact CTA) reflects the fields discussed for the Listing
data model.

Not yet reflected in `prisma/schema.prisma`: structured (not free-text) utilities
included/excluded, appliances, and a neighborhood blurb field. `Amenity`/`PetPolicy`/`Fee`
exist in the schema already but have no CRUD UI yet.
