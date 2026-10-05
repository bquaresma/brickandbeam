import { expect, test, type Browser, type Page } from "@playwright/test";
import { unzipSync } from "fflate";
import sharp from "sharp";

const password = "correct-horse-battery";

async function signUp(page: Page, label: string) {
  const email = `${label}-${Date.now()}@example.com`;
  await page.goto("/signup");
  await page.locator("#name").fill("Smoke Tester");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/dashboard");
  return email;
}

// The walk-through shows one step at a time; go to a step by its sidebar name.
async function openStep(page: Page, title: string) {
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  await page
    .getByRole("navigation", { name: "Sections" })
    .getByRole("button", { name: new RegExp(`^${escaped}`) })
    .click();
}

// The public details are folded into groups; open every folded one.
async function expandDetails(page: Page) {
  const closed = page.locator("details:not([open]) > summary");
  while ((await closed.count()) > 0) await closed.first().click();
}

async function createDraftListing(page: Page, story = "A house with a story.") {
  await page.goto("/dashboard/properties/new");
  await expect(page.locator('input[name="isWholeHouse"]')).toBeChecked();
  await page.locator("#addressLine1").fill("1 Test Street");
  await page.locator("#city").fill("Pittsburgh");
  await page.locator("#state").fill("PA");
  await page.locator("#zip").fill("15201");
  await page.locator("#buildYear").fill("1900");
  await page.getByRole("button", { name: "Add property" }).click();
  await page.waitForURL(/\/dashboard\/properties\/[^/]+$/);

  await page.getByRole("link", { name: "+ Add listing" }).click();
  await page.locator("#headline").fill("Smoke test house");
  await page.locator("#story").fill(story);
  await page.getByRole("button", { name: "Create listing" }).click();
  await page.waitForURL(/\/dashboard\/properties\/[^/]+$/);

  const href = await page.locator('a[href^="/listings/"]').first().getAttribute("href");
  expect(href).toBeTruthy();
  return { propertyUrl: page.url(), listingPath: href! };
}

async function openEditListing(page: Page, propertyUrl: string) {
  await page.goto(propertyUrl);
  await page.getByRole("link", { name: "Edit listing" }).click();
}

test("landlord lists a property and receives a lead", async ({ page, browser }) => {
  const email = await signUp(page, "smoke");

  // Sign-in tolerates different capitalization.
  await page.context().clearCookies();
  await page.goto("/login");
  await page.locator("#email").fill(email.toUpperCase());
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard");

  const { propertyUrl, listingPath } = await createDraftListing(page);

  // The owner can preview the draft; everyone else gets a 404.
  await page.goto(listingPath);
  await expect(page.getByText("not public")).toBeVisible();
  const anonymous = await (await browser.newContext()).newPage();
  const draft = await anonymous.goto(new URL(listingPath, page.url()).toString());
  expect(draft?.status()).toBe(404);

  // Publish.
  await openEditListing(page, propertyUrl);
  await page.locator("#status").selectOption("PUBLISHED");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.waitForURL(/\/dashboard\/properties\/[^/]+$/);

  // The public page has no account email in it and accepts a lead.
  await anonymous.goto(new URL(listingPath, page.url()).toString());
  expect(await anonymous.content()).not.toContain(email);
  await anonymous.locator('input[name="name"]').fill("Prospect");
  await anonymous.locator('input[name="email"]').fill("Prospect@Example.com");
  await anonymous.getByRole("button", { name: "Send Request" }).click();
  await anonymous.waitForURL("**?sent=true");

  // The lead shows up in the landlord inbox, with the email normalized.
  await page.goto("/dashboard/leads");
  await expect(page.getByText("prospect@example.com")).toBeVisible();
});

test("photos are converted, served responsively, and protected", async ({
  page,
  browser,
}) => {
  await signUp(page, "photos");
  const { propertyUrl, listingPath } = await createDraftListing(page);

  // A 3000x2000 photo that carries GPS coordinates, like a phone photo would.
  const jpeg = await sharp({
    create: {
      width: 3000,
      height: 2000,
      channels: 3,
      background: { r: 120, g: 80, b: 60 },
    },
  })
    .withExif({
      IFD3: {
        GPSLatitudeRef: "N",
        GPSLatitude: "40/1 28/1 0/1",
        GPSLongitudeRef: "W",
        GPSLongitude: "79/1 57/1 0/1",
      },
    })
    .jpeg()
    .toBuffer();
  expect((await sharp(jpeg).metadata()).exif).toBeDefined();

  await openEditListing(page, propertyUrl);
  const chooser = page.getByLabel("Choose photos to upload");

  // iPhone HEIC is refused up front with instructions, before any upload.
  await chooser.setInputFiles({
    name: "IMG_0001.heic",
    mimeType: "image/heic",
    buffer: Buffer.alloc(64),
  });
  await expect(page.getByText("Most Compatible").first()).toBeVisible();
  await page.getByRole("button", { name: "Dismiss" }).click();

  // A real photo uploads, converts and appears in the manager.
  await chooser.setInputFiles({
    name: "kitchen.jpg",
    mimeType: "image/jpeg",
    buffer: jpeg,
  });
  const areaSelect = page.getByLabel("What this photo shows");
  await expect(areaSelect).toBeVisible({ timeout: 90_000 });
  await expect(page.getByText("Hero image", { exact: true })).toBeVisible();

  await areaSelect.selectOption("KITCHEN");
  await page.getByLabel("Caption").fill("Original cabinets");
  await page
    .getByLabel("Alt text for screen readers")
    .fill("A kitchen with original cabinets");
  await page.getByLabel("Alt text for screen readers").blur();
  await page.waitForTimeout(500);
  await page.reload();
  await expect(page.getByLabel("What this photo shows")).toHaveValue("KITCHEN");
  await expect(page.getByLabel("Caption")).toHaveValue("Original cabinets");

  // Find the generated files from the manager's thumbnail URL.
  const thumb = await page.locator("ul img").first().getAttribute("src");
  expect(thumb).toMatch(/^\/media\/listings\/[^/]+\/[^/]+\/[^/]+\/display-400\.avif$/);
  const folder = thumb!.replace(/display-400\.avif$/, "");
  const listingFolder = folder.split("/").slice(0, 5).join("/"); // /media/listings/<l>/<p>/

  // While the listing is a draft, only the owner can fetch its images.
  const anonymous = await browser.newContext();
  expect((await page.request.get(thumb!)).status()).toBe(200);
  expect((await anonymous.request.get(thumb!)).status()).toBe(404);

  // Publish; the public page now serves the image to everyone.
  await page.locator("#status").selectOption("PUBLISHED");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.waitForURL(/\/dashboard\/properties\/[^/]+$/);

  const avif = await anonymous.request.get(`${folder}display-800.avif`);
  expect(avif.status()).toBe(200);
  expect(avif.headers()["content-type"]).toBe("image/avif");
  expect(avif.headers()["cache-control"]).toContain("immutable");

  // Every variant is stripped of GPS; the private master is never served.
  const served = await anonymous.request.get(`${folder}display-1200.jpg`);
  expect(served.status()).toBe(200);
  expect((await sharp(await served.body()).metadata()).exif).toBeUndefined();
  expect((await anonymous.request.get(`${listingFolder}master.jpg`)).status()).toBe(404);
  const exportJpeg = await anonymous.request.get(`${folder}export-2048.jpg`);
  expect((await sharp(await exportJpeg.body()).metadata()).width).toBe(2048);

  // The public page renders a responsive <picture> with AVIF, WebP and JPEG.
  const publicPage = await anonymous.newPage();
  await publicPage.goto(new URL(listingPath, page.url()).toString());
  const picture = publicPage.locator("picture").first();
  await expect(picture.locator("source[type='image/avif']")).toHaveAttribute(
    "srcset",
    /400w.*1600w/,
  );
  await expect(picture.locator("source[type='image/webp']")).toHaveCount(1);
  const img = picture.locator("img");
  await expect(img).toHaveAttribute("width", "3000");
  await expect(img).toHaveAttribute("alt", "A kitchen with original cabinets");

  // The lightbox opens from the keyboard and closes with Escape.
  await publicPage
    .getByRole("button", { name: /Open photo/ })
    .first()
    .click();
  await expect(publicPage.getByRole("dialog", { name: "Photo viewer" })).toBeVisible();
  await publicPage.keyboard.press("Escape");
  await expect(publicPage.getByRole("dialog", { name: "Photo viewer" })).toBeHidden();

  // Deleting removes the row and every file.
  await openEditListing(page, propertyUrl);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByLabel("What this photo shows")).toHaveCount(0);
  await expect
    .poll(async () => (await anonymous.request.get(`${folder}display-800.avif`)).status())
    .toBe(404);
});

test("another landlord cannot upload to a listing they don't own", async ({
  page,
  browser,
}) => {
  await signUp(page, "owner");
  const { listingPath } = await createDraftListing(page);
  const id = listingPath.split("/").pop()!;
  const png = await sharp({
    create: { width: 64, height: 64, channels: 3, background: "#888" },
  })
    .png()
    .toBuffer();
  const upload = {
    listingId: id,
    file: { name: "a.png", mimeType: "image/png", buffer: png },
  };

  // The owner can upload.
  expect((await page.request.post("/api/uploads", { multipart: upload })).status()).toBe(
    201,
  );

  // Another signed-in landlord gets a 404, as if the listing didn't exist.
  const intruder = await browser.newContext();
  const intruderPage = await intruder.newPage();
  await signUp(intruderPage, "intruder");
  expect(
    (await intruderPage.request.post("/api/uploads", { multipart: upload })).status(),
  ).toBe(404);

  // And signed-out requests are refused outright.
  const anonymous = await browser.newContext();
  expect(
    (await anonymous.request.post("/api/uploads", { multipart: upload })).status(),
  ).toBe(401);

  // Anything that isn't an image is rejected with a plain message.
  const notAnImage = await page.request.post("/api/uploads", {
    multipart: {
      listingId: id,
      file: {
        name: "x.jpg",
        mimeType: "image/jpeg",
        buffer: Buffer.from("definitely not an image file"),
      },
    },
  });
  expect(notAnImage.status()).toBe(422);

  // A HEIC that gets past the browser check is still refused by the server.
  const heic = Buffer.alloc(64);
  heic.write("ftyp", 4, "ascii");
  heic.write("heic", 8, "ascii");
  const heicResponse = await page.request.post("/api/uploads", {
    multipart: {
      listingId: id,
      file: { name: "x.jpg", mimeType: "image/jpeg", buffer: heic },
    },
  });
  expect(heicResponse.status()).toBe(422);
  expect((await heicResponse.json()).code).toBe("heic");
});

test("house details and floor plans: saved, shown publicly, 'Not sure' stays private", async ({
  page,
  browser,
}) => {
  await signUp(page, "details");
  const { propertyUrl, listingPath } = await createDraftListing(page);

  await page.goto(propertyUrl);
  await page.getByRole("link", { name: "House details" }).click();
  await page.waitForURL(/\/walkthrough$/);
  const walkthroughUrl = page.url();

  const saved = (section: string) =>
    page.locator(`#${section}`).getByText("Saved", { exact: true });

  // Kitchen: an answer, a "No", a "Not sure", and a note.
  await openStep(page, "Kitchen");
  await page.locator("#kitchen-range").selectOption("gas");
  await page.locator("#kitchen-dishwasher").selectOption("no");
  await page
    .getByRole("radiogroup", { name: "Outlets near the sink are GFCI-protected" })
    .getByRole("radio", { name: "Not sure" })
    .click();
  await page.locator("#kitchen-notes").fill("The floor slopes toward the window.");
  await expect(saved("kitchen")).toBeVisible();

  // A bathroom with a claw-foot tub and no outlet.
  await openStep(page, "Bathrooms");
  await page.getByRole("button", { name: "+ Add a bathroom" }).click();
  const baths = page.locator("#bathrooms");
  await baths.getByLabel("Name this one (optional)").fill("Upstairs bath");
  await baths.getByLabel("Tub", { exact: true }).selectOption("clawfoot");
  await baths.getByLabel("Outlets", { exact: true }).selectOption("none");
  await expect(saved("bathrooms")).toBeVisible();

  // Basement.
  await openStep(page, "Basement");
  await page.locator("#basement-type").selectOption("full");
  await page.locator("#basement-moisture").selectOption("damp");
  await page
    .getByRole("radiogroup", { name: "Sump pump" })
    .getByRole("radio", { name: "Yes" })
    .click();
  await expect(saved("basement")).toBeVisible();

  // Character: a catalog chip and one of our own.
  await openStep(page, "Character and quirks");
  await page.getByRole("button", { name: "Original hardwood or pine floors" }).click();
  await page.getByLabel("Add your own: Features").fill("a dumbwaiter");
  await page.getByLabel("Add your own: Features").press("Enter");
  await expect(saved("character")).toBeVisible();

  // A room, described honestly.
  await openStep(page, "Rooms & floor plans");
  await page.getByRole("button", { name: "+ Add a room" }).click();
  const rooms = page.locator("#rooms");
  await rooms.getByLabel("Room name").fill("Attic suite");
  await rooms.getByLabel("Type", { exact: true }).selectOption("non-conforming-bedroom");
  await rooms.getByLabel("Floor", { exact: true }).selectOption("Attic");
  await rooms.getByLabel("Marker on your floor plan").fill("A");
  await rooms.getByLabel("Length (ft)").fill("11");
  await rooms.getByLabel("Width (ft)").fill("14");
  await rooms
    .getByRole("radiogroup", { name: "Counts as a bedroom" })
    .getByRole("radio", { name: "No", exact: true })
    .click();
  await page.getByRole("button", { name: "Save rooms" }).click();
  await expect(saved("rooms")).toBeVisible();

  // Floor plans: one per level; uploading again replaces it.
  const plan = await sharp({
    create: { width: 1600, height: 1200, channels: 3, background: "#fff" },
  })
    .png()
    .toBuffer();
  const atticPlan = page.getByAltText("Attic floor plan");
  await page
    .getByLabel("Upload Attic floor plan")
    .setInputFiles({ name: "attic.png", mimeType: "image/png", buffer: plan });
  await expect(atticPlan).toBeVisible({ timeout: 60_000 });
  const firstSrc = await atticPlan.getAttribute("src");

  await page
    .getByLabel("Upload Attic floor plan")
    .setInputFiles({ name: "attic2.png", mimeType: "image/png", buffer: plan });
  await expect
    .poll(async () => atticPlan.getAttribute("src"), { timeout: 60_000 })
    .not.toBe(firstSrc);
  await expect(atticPlan).toHaveCount(1);

  // Everything persisted: reload and look. The "Not sure" answer is an open item.
  await page.reload();
  await openStep(page, "Kitchen");
  await expect(page.locator("#kitchen-range")).toHaveValue("gas");
  await expect(page.locator("#kitchen").getByText("Open item")).toBeVisible();
  await openStep(page, "Bathrooms");
  await expect(
    page.locator("#bathrooms").getByLabel("Name this one (optional)"),
  ).toHaveValue("Upstairs bath");
  await openStep(page, "Rooms & floor plans");
  await expect(page.locator("#rooms").getByLabel("Room name")).toHaveValue("Attic suite");

  // Publish, then read the public page as a stranger.
  await openEditListing(page, propertyUrl);
  await page.locator("#status").selectOption("PUBLISHED");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.waitForURL(/\/dashboard\/properties\/[^/]+$/);

  const anonymous = await (await browser.newContext()).newPage();
  await anonymous.goto(new URL(listingPath, page.url()).toString());
  await expandDetails(anonymous);
  const html = await anonymous.content();

  const details = anonymous.locator("section", { hasText: "The Details" });
  await expect(details.getByText("Gas", { exact: true })).toBeVisible();
  await expect(details.getByText("No", { exact: true }).first()).toBeVisible(); // dishwasher
  await expect(details.getByText("Upstairs bath")).toBeVisible();
  await expect(details.getByText("Claw-foot", { exact: true })).toBeVisible();
  await expect(details.getByText("Occasionally damp")).toBeVisible();
  await expect(
    details.getByText("Original hardwood or pine floors, a dumbwaiter"),
  ).toBeVisible();
  await expect(details.getByText("The floor slopes toward the window.")).toBeVisible();

  // The "Not sure" answer never reaches the page.
  expect(html).not.toContain("GFCI-protected");
  expect(html.toLowerCase()).not.toContain("not sure");

  // Floor plan with its legend and the "not to scale" label.
  const layout = anonymous.locator("section", { hasText: "The House, Room by Room" });
  await expect(layout.locator("picture img")).toHaveAttribute("alt", "Attic floor plan");
  await expect(
    layout.getByText("Approximate — not to scale. Tap to enlarge."),
  ).toBeVisible();
  await expect(layout.getByText("Attic suite")).toBeVisible();
  await expect(layout.getByText("11 × 14 ft")).toBeVisible();
  await expect(
    layout.getByText("Non-conforming bedroom · Not counted as a bedroom"),
  ).toBeVisible();

  // The basement and bathroom come from their own cards, with no extra entry:
  // the basement gets its own floor tab, and a bathroom with no floor set
  // appears under "Other spaces".
  await layout.getByRole("tab", { name: "Basement" }).click();
  await expect(layout.getByText("Occasionally damp")).toBeVisible();
  await expect(layout.getByText("Full", { exact: true })).toBeVisible();
  await layout.getByRole("tab", { name: "Other spaces" }).click();
  await expect(layout.getByText("Upstairs bath")).toBeVisible();
  await expect(layout.getByText("Claw-foot")).toBeVisible();

  // Another landlord cannot even open this walk-through.
  const intruder = await (await browser.newContext()).newPage();
  await signUp(intruder, "intruder2");
  expect((await intruder.goto(walkthroughUrl))?.status()).toBe(404);
});

async function adminSession(browser: Browser) {
  const email = "e2e-admin@example.com"; // matches ADMIN_EMAILS in playwright.config.ts
  const page = await (await browser.newContext()).newPage();
  // 201 the first time, 409 afterwards — either way the account exists.
  await page.request.post("/api/auth/signup", {
    data: { name: "E2E Admin", email, password },
  });
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard");
  return page;
}

test("own details and questions: built-ins, facts, custom questions, and the review queue", async ({
  page,
  browser,
}) => {
  const stamp = Date.now();
  const bike = `Bike storage ${stamp}`;
  const pool = `Pool ${stamp}`;
  const wall = `Wall area ${stamp}`;

  await signUp(page, "author");
  const { propertyUrl, listingPath } = await createDraftListing(page);
  await page.goto(propertyUrl);
  await page.getByRole("link", { name: "House details" }).click();
  await page.waitForURL(/\/walkthrough$/);
  const walkthroughUrl = page.url();
  const saved = (section: string) =>
    page.locator(`#${section}`).getByText("Saved", { exact: true });

  // Built-in questions for locks, cameras, EV charging.
  await openStep(page, "Energy, solar and EV charging");
  await page.locator("#energy-evCharging").selectOption("outlet-240");
  await expect(saved("energy")).toBeVisible();
  await openStep(page, "Technology and security");
  await page.locator("#tech-lockType").selectOption("smart");
  await page.locator("#tech-cameras").selectOption("exterior");
  await expect(saved("tech")).toBeVisible();

  // A quick fact.
  await openStep(page, "Your own questions");
  const custom = page.locator("#custom");
  await custom.getByRole("button", { name: "+ Add a fact" }).click();
  await custom.getByLabel("Label", { exact: true }).fill("Internet");
  await custom.getByLabel("Value", { exact: true }).fill("Fiber available");
  await custom.getByRole("button", { name: "Save facts" }).click();
  await expect(custom.getByText("Saved", { exact: true })).toBeVisible();

  // A house-level yes/no question, placed in the Outdoors card.
  await custom.locator("#q-label").fill(bike);
  await custom.locator("#q-section").selectOption("outdoors");
  await custom.getByRole("button", { name: "Add question" }).click();
  await expect(custom.getByRole("listitem").filter({ hasText: bike })).toBeVisible();
  await openStep(page, "Outdoors and parking");
  const bikeAnswer = page.getByRole("radiogroup", { name: bike });
  await expect(bikeAnswer).toBeVisible();
  await bikeAnswer.getByRole("radio", { name: "Yes", exact: true }).click();
  await expect(saved("outdoors")).toBeVisible();

  // A number question asked once for every room.
  await openStep(page, "Your own questions");
  await custom.locator("#q-label").fill(wall);
  await custom.locator("#q-type").selectOption("NUMBER");
  await custom.locator("#q-unit").fill("sq ft");
  await custom.locator("#q-section").selectOption("rooms");
  await custom.getByRole("button", { name: "Add question" }).click();
  await expect(custom.getByRole("listitem").filter({ hasText: wall })).toBeVisible();

  await openStep(page, "Rooms & floor plans");
  await page.getByRole("button", { name: "+ Add a room" }).click();
  const rooms = page.locator("#rooms");
  await rooms.getByLabel("Room name").fill("Back bedroom");
  await rooms.getByLabel(`${wall} (sq ft)`).fill("120");
  await page.getByRole("button", { name: "Save rooms" }).click();
  await expect(saved("rooms")).toBeVisible();

  // Suggest the bike question for everyone, and a second one that will be rejected.
  await openStep(page, "Your own questions");
  await custom
    .getByRole("listitem")
    .filter({ hasText: bike })
    .getByRole("button", { name: "Suggest for everyone" })
    .click();
  await custom
    .getByLabel(/Why would other landlords want this/)
    .fill("Rowhouses rarely have a garage.");
  await custom.getByRole("button", { name: "Send for review" }).click();
  await expect(
    custom
      .getByRole("listitem")
      .filter({ hasText: bike })
      .getByText("In review", { exact: true }),
  ).toBeVisible();

  await custom.locator("#q-label").fill(pool);
  await custom.locator("#q-section").selectOption("outdoors");
  await custom.getByRole("button", { name: "Add question" }).click();
  await custom
    .getByRole("listitem")
    .filter({ hasText: pool })
    .getByRole("button", { name: "Suggest for everyone" })
    .click();
  await custom.getByRole("button", { name: "Send for review" }).click();
  await expect(
    custom
      .getByRole("listitem")
      .filter({ hasText: pool })
      .getByText("In review", { exact: true }),
  ).toBeVisible();

  // Everything shows on the public page.
  await openEditListing(page, propertyUrl);
  await page.locator("#status").selectOption("PUBLISHED");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.waitForURL(/\/dashboard\/properties\/[^/]+$/);

  const anonymous = await (await browser.newContext()).newPage();
  await anonymous.goto(new URL(listingPath, page.url()).toString());
  await expandDetails(anonymous);
  const details = anonymous.locator("section", { hasText: "The Details" });
  await expect(details.getByText("240 V outlet at the parking spot")).toBeVisible();
  await expect(details.getByText("Smart lock (app or code)")).toBeVisible();
  await expect(details.getByText("Exterior only")).toBeVisible();
  await expect(details.getByText("Fiber available")).toBeVisible();
  await expect(details.getByText(`${bike}:`)).toBeVisible();
  const layout = anonymous.locator("section", { hasText: "The House, Room by Room" });
  await expect(layout.getByText(`${wall}:`)).toBeVisible();
  await expect(layout.getByText("120 sq ft")).toBeVisible();

  // The author is not an admin: the review page does not exist for them.
  expect((await page.goto("/dashboard/admin/questions"))?.status()).toBe(404);

  // The admin sees both suggestions with who and why, and decides.
  const admin = await adminSession(browser);
  await admin.goto("/dashboard");
  await expect(admin.getByRole("link", { name: /^Review/ })).toBeVisible();
  await admin.getByRole("link", { name: /^Review/ }).click();
  const queue = admin
    .getByRole("listitem")
    .filter({ has: admin.locator(`input[value="${bike}"]`) });
  await expect(queue).toContainText("Rowhouses rarely have a garage.");
  await expect(queue).toContainText("Yes / No / Not sure");
  await queue.getByRole("button", { name: "Approve for everyone" }).click();

  const poolCard = admin
    .getByRole("listitem")
    .filter({ has: admin.locator(`input[value="${pool}"]`) });
  await poolCard.getByRole("button", { name: "Reject…" }).click();
  await poolCard.getByRole("button", { name: "Reject", exact: true }).click();
  await expect(poolCard.getByRole("alert")).toContainText("Say why"); // a reason is required
  await poolCard.getByLabel(/Reason/).fill("Already covered by Outdoors → Yard");
  await poolCard.getByRole("button", { name: "Reject", exact: true }).click();
  // Both decisions leave the queue. (Other items may be waiting in a shared
  // database, so check these two rather than an empty list.)
  await expect(queue).toHaveCount(0);
  await expect(poolCard).toHaveCount(0);

  // Approved: another landlord gets it in their walk-through at once.
  const other = await (await browser.newContext()).newPage();
  await signUp(other, "other");
  const second = await createDraftListing(other);
  await other.goto(second.propertyUrl);
  await other.getByRole("link", { name: "House details" }).click();
  await openStep(other, "Outdoors and parking");
  await expect(other.getByRole("radiogroup", { name: bike })).toBeVisible();
  await expect(other.getByRole("radiogroup", { name: pool })).toHaveCount(0);

  // Rejected: still works for its author, with the reason shown.
  await page.goto(walkthroughUrl);
  await openStep(page, "Your own questions");
  const poolItem = page
    .locator("#custom")
    .getByRole("listitem")
    .filter({ hasText: pool });
  await expect(poolItem).toContainText("Already covered by Outdoors → Yard");
  await expect(poolItem).toContainText("It still works for you");
  await openStep(page, "Outdoors and parking");
  await expect(page.getByRole("radiogroup", { name: pool })).toBeVisible();
});

async function openWalkthrough(page: Page) {
  const { propertyUrl, listingPath } = await createDraftListing(page);
  await page.goto(propertyUrl);
  await page.getByRole("link", { name: "House details" }).click();
  await page.waitForURL(/\/walkthrough$/);
  return { propertyUrl, listingPath };
}

test("walk-through: one step at a time, autosave, follow-ups, and a review step", async ({
  page,
}) => {
  await signUp(page, "steps");
  await openWalkthrough(page);
  const nav = page.getByRole("navigation", { name: "Sections" });
  const saved = (section: string) =>
    page.locator(`#${section}`).getByText("Saved", { exact: true });

  // It opens on the first step; every other step is out of sight.
  await expect(page.locator("#rooms")).toBeVisible();
  await expect(page.locator("#kitchen")).toBeHidden();
  await expect(nav.getByRole("button", { name: /^Review/ })).toBeVisible();

  await openStep(page, "Basement");
  await expect(page.locator("#basement")).toBeVisible();
  await expect(page.locator("#rooms")).toBeHidden();

  // Follow-up questions appear only once they apply.
  await expect(page.locator("#basement-finish")).toHaveCount(0);
  await page.locator("#basement-type").selectOption("full");
  await expect(page.locator("#basement-finish")).toBeVisible();
  await expect(page.locator("#basement-moistureYear")).toHaveCount(0);
  await page.locator("#basement-moisture").selectOption("water-history");
  await expect(page.locator("#basement-moistureYear")).toBeVisible();
  await page.locator("#basement-moistureYear").fill("2019");

  // No Save button: it saves on its own.
  await expect(page.getByRole("button", { name: /^Save basement/ })).toHaveCount(0);
  await expect(saved("basement")).toBeVisible();

  // Answers survive moving between steps.
  await openStep(page, "Kitchen");
  await page.locator("#kitchen-range").selectOption("gas");
  await openStep(page, "Basement");
  await openStep(page, "Kitchen");
  await expect(page.locator("#kitchen-range")).toHaveValue("gas");

  // A "Not sure" shows up in the sidebar as an open item.
  await page
    .getByRole("radiogroup", { name: "Pantry or butler's pantry" })
    .getByRole("radio", { name: "Not sure" })
    .click();
  await expect(nav.getByRole("button", { name: /^Kitchen/ })).toContainText("1 open");
  await expect(saved("kitchen")).toBeVisible();

  // Next and Back walk the house in order.
  await page.getByRole("button", { name: /^Next: Bathrooms/ }).click();
  await expect(page.locator("#bathrooms")).toBeVisible();
  await page.getByRole("button", { name: "← Back" }).click();
  await expect(page.locator("#kitchen")).toBeVisible();

  // The review step lists what still needs a look, with a way back.
  await openStep(page, "Review");
  await expect(page.locator("#review")).toContainText("1 marked “Not sure”");
  await page.locator("#review").getByRole("button", { name: "Kitchen" }).click();
  await expect(page.locator("#kitchen")).toBeVisible();

  // Everything persisted, and a link can open a specific step.
  await page.goto(`${page.url().split("#")[0]}#basement`);
  await page.reload();
  await expect(page.locator("#basement")).toBeVisible();
  await expect(page.locator("#basement-moisture")).toHaveValue("water-history");
  await expect(page.locator("#basement-moistureYear")).toHaveValue("2019");
});

test("walk-through on a phone is a guided flow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await signUp(page, "phone");
  await openWalkthrough(page);

  await expect(page.getByText(/^Step 1 of \d+ — Rooms & floor plans/)).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Sections" })).toBeHidden();

  await page.getByRole("button", { name: /^Next:/ }).click();
  await expect(page.getByText(/^Step 2 of \d+ — Outdoors and parking/)).toBeVisible();
  await expect(page.locator("#outdoors")).toBeVisible();

  await page.getByLabel("Jump to").selectOption("kitchen");
  await expect(page.getByText(/— Kitchen$/)).toBeVisible();
  await expect(page.locator("#kitchen")).toBeVisible();

  // Nothing pushes the page wider than the screen.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});

test("public details: at-a-glance chips and foldable groups", async ({
  page,
  browser,
}) => {
  await signUp(page, "groups");
  const { propertyUrl, listingPath } = await openWalkthrough(page);
  const saved = (section: string) =>
    page.locator(`#${section}`).getByText("Saved", { exact: true });

  await openStep(page, "Kitchen");
  await page.locator("#kitchen-range").selectOption("gas");
  await expect(saved("kitchen")).toBeVisible();
  await openStep(page, "Systems");
  await page.locator("#systems-heat").selectOption("steam");
  await expect(saved("systems")).toBeVisible();
  await openStep(page, "Character and quirks");
  await page.getByRole("button", { name: "Steep or narrow stairs" }).click();
  await expect(saved("character")).toBeVisible();
  await openStep(page, "Good to know");
  await page.getByRole("button", { name: "Past water intrusion" }).click();
  await expect(saved("knownConditions")).toBeVisible();

  await openEditListing(page, propertyUrl);
  await page.locator("#status").selectOption("PUBLISHED");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.waitForURL(/\/dashboard\/properties\/[^/]+$/);

  const visitor = await (await browser.newContext()).newPage();
  await visitor.goto(new URL(listingPath, page.url()).toString());
  const section = visitor.locator("section", { hasText: "The Details" });

  // The facts a renter scans for are chips, with nothing to open.
  await expect(section.getByText("Gas range", { exact: true })).toBeVisible();
  await expect(section.getByText("Steam heat", { exact: true })).toBeVisible();
  await expect(section.getByText("Steep or narrow stairs").first()).toBeVisible();

  // Groups: the first and "Good to know" start open; the rest fold away.
  const inside = section.locator("details", { hasText: "Inside the house" });
  const systems = section.locator("details", { hasText: "Systems, energy and tech" });
  const good = section.locator("details", { hasText: "Good to know" });
  expect(await inside.getAttribute("open")).not.toBeNull();
  expect(await good.getAttribute("open")).not.toBeNull();
  expect(await systems.getAttribute("open")).toBeNull();
  await expect(good.getByText("Past water intrusion")).toBeVisible();
  await expect(systems.getByText("Steam radiators")).toBeHidden();

  // One tap opens a folded group.
  await systems.locator("summary").click();
  await expect(systems.getByText("Steam radiators")).toBeVisible();
});

test("channel kit: ready-to-paste ads, wording check, photo zip, flyer", async ({
  page,
  browser,
}) => {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await signUp(page, "kit");
  const { propertyUrl, listingPath } = await createDraftListing(
    page,
    "Perfect for young professionals. Sunny rooms with original floors.",
  );
  const listingId = listingPath.split("/").pop()!;

  // Two photos; the first becomes the hero.
  const jpeg = await sharp({
    create: {
      width: 3000,
      height: 2000,
      channels: 3,
      background: { r: 120, g: 80, b: 60 },
    },
  })
    .jpeg()
    .toBuffer();
  for (const area of ["EXTERIOR", "KITCHEN"]) {
    const response = await page.request.post("/api/uploads", {
      multipart: {
        listingId,
        area,
        file: { name: `${area}.jpg`, mimeType: "image/jpeg", buffer: jpeg },
      },
    });
    expect(response.status()).toBe(201);
  }

  await page.goto(propertyUrl);
  await page.getByRole("link", { name: "Post this listing" }).click();
  await page.waitForURL(/\/share$/);
  await expect(page.getByRole("heading", { name: "Post this listing" })).toBeVisible();

  // One card per launch channel.
  for (const name of [
    "Zillow Rental Manager",
    "Craigslist",
    "Facebook Marketplace",
    "Zumper",
    "Facebook groups",
  ]) {
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  }

  // What's missing is said plainly, not guessed.
  await expect(page.getByText("The ads will read better with:")).toBeVisible();
  await expect(page.getByText("the monthly rent (unit details)")).toBeVisible();

  // The wording check flags the phrase, explains it, and doesn't block anything.
  const check = page.getByRole("region", { name: "Wording check" });
  await expect(check).toContainText("“Perfect for young professionals”");
  await expect(check).toContainText("Advisory only");

  // Every ad carries the disclosures for a 1900 house.
  const craigslist = page.locator("#craigslist");
  await expect(craigslist).toContainText("Built in 1900");
  await expect(craigslist).toContainText("lead-based paint");
  await expect(craigslist).toContainText("Equal Housing Opportunity.");
  await expect(page.locator("#facebook-group")).toContainText(
    "Equal Housing Opportunity.",
  );
  await expect(page.locator("#zillow")).toContainText("Property type");

  // Copy puts exactly the visible text on the clipboard.
  await craigslist
    .getByRole("button", { name: "Copy Posting title for Craigslist" })
    .click();
  await expect(
    craigslist.getByRole("button", { name: "Copy Posting title for Craigslist" }),
  ).toHaveText("Copied");
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  const titleRow = craigslist
    .locator("div")
    .filter({ has: page.getByText("Posting title", { exact: true }) });
  const shownTitle = (
    await titleRow.locator("span.break-words").first().innerText()
  ).trim();
  expect(copied).toBe(shownTitle);
  expect(copied.length).toBeGreaterThan(0);
  expect(copied.length).toBeLessThanOrEqual(70);

  // The numbered photo zip: hero first, 2048 px exports, no location data.
  const zip = await page.request.get(`/api/listings/${listingId}/photos.zip`);
  expect(zip.status()).toBe(200);
  expect(zip.headers()["content-type"]).toBe("application/zip");
  expect(zip.headers()["content-disposition"]).toContain("-photos.zip");
  const files = unzipSync(new Uint8Array(await zip.body()));
  expect(Object.keys(files)).toEqual(["01-exterior-hero.jpg", "02-kitchen.jpg"]);
  const meta = await sharp(Buffer.from(files["01-exterior-hero.jpg"])).metadata();
  expect(meta.width).toBe(2048);
  expect(meta.exif).toBeUndefined();

  // Only the owner can download it.
  const stranger = await browser.newContext();
  expect(
    (await stranger.request.get(`/api/listings/${listingId}/photos.zip`)).status(),
  ).toBe(401);
  const other = await (await browser.newContext()).newPage();
  await signUp(other, "kitother");
  expect(
    (await other.request.get(`/api/listings/${listingId}/photos.zip`)).status(),
  ).toBe(404);
  expect((await other.goto(page.url()))?.status()).toBe(404);

  // The flyer.
  await page.getByRole("link", { name: "Make a printable flyer" }).click();
  await page.waitForURL(/\/flyer$/);
  const flyer = page.getByRole("article", { name: "Flyer" });
  await expect(flyer).toContainText("Smoke test house");
  await expect(flyer).toContainText("Showings by appointment");
  await expect(flyer).toContainText("lead-based paint");
  await expect(flyer).toContainText("Equal Housing Opportunity.");
  await expect(flyer.locator("picture img")).toBeVisible();
  await expect(page.getByRole("button", { name: "Print or save as PDF" })).toBeVisible();

  // Printing drops the dashboard chrome and the toolbar, keeping only the flyer...
  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("link", { name: "Leads" })).toBeHidden();
  await expect(page.getByRole("button", { name: "Print or save as PDF" })).toBeHidden();
  await expect(flyer).toBeVisible();

  // ...and fits on one letter-size page.
  const pdf = await page.pdf({ format: "Letter", printBackground: true });
  const pages = pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? [];
  expect(pages).toHaveLength(1);
  await page.emulateMedia({ media: "screen" });
});
