import { expect, test, type Page } from "@playwright/test";
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

async function createDraftListing(page: Page) {
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
  await page.locator("#story").fill("A house with a story.");
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
  await page.locator("#kitchen-range").selectOption("gas");
  await page.locator("#kitchen-dishwasher").selectOption("no");
  await page
    .getByRole("radiogroup", { name: "Outlets near the sink are GFCI-protected" })
    .getByRole("radio", { name: "Not sure" })
    .click();
  await page.locator("#kitchen-notes").fill("The floor slopes toward the window.");
  await page.getByRole("button", { name: "Save kitchen" }).click();
  await expect(saved("kitchen")).toBeVisible();

  // A bathroom with a claw-foot tub and no outlet.
  await page.getByRole("button", { name: "+ Add a bathroom" }).click();
  const baths = page.locator("#bathrooms");
  await baths.getByLabel("Name this one (optional)").fill("Upstairs bath");
  await baths.getByLabel("Tub", { exact: true }).selectOption("clawfoot");
  await baths.getByLabel("Outlets", { exact: true }).selectOption("none");
  await page.getByRole("button", { name: "Save bathrooms" }).click();
  await expect(saved("bathrooms")).toBeVisible();

  // Basement.
  await page.locator("#basement-type").selectOption("full");
  await page.locator("#basement-moisture").selectOption("damp");
  await page
    .getByRole("radiogroup", { name: "Sump pump" })
    .getByRole("radio", { name: "Yes" })
    .click();
  await page.getByRole("button", { name: "Save basement" }).click();
  await expect(saved("basement")).toBeVisible();

  // Character: a catalog chip and one of our own.
  await page.getByRole("button", { name: "Original hardwood or pine floors" }).click();
  await page.getByLabel("Add your own: Features").fill("a dumbwaiter");
  await page.getByLabel("Add your own: Features").press("Enter");
  await page.getByRole("button", { name: "Save character and quirks" }).click();
  await expect(saved("character")).toBeVisible();

  // A room, described honestly.
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
  await expect(page.locator("#kitchen-range")).toHaveValue("gas");
  await expect(page.locator("#kitchen").getByText("Open item")).toBeVisible();
  await expect(
    page.locator("#bathrooms").getByLabel("Name this one (optional)"),
  ).toHaveValue("Upstairs bath");
  await expect(page.locator("#rooms").getByLabel("Room name")).toHaveValue("Attic suite");

  // Publish, then read the public page as a stranger.
  await openEditListing(page, propertyUrl);
  await page.locator("#status").selectOption("PUBLISHED");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.waitForURL(/\/dashboard\/properties\/[^/]+$/);

  const anonymous = await (await browser.newContext()).newPage();
  await anonymous.goto(new URL(listingPath, page.url()).toString());
  const html = await anonymous.content();

  const details = anonymous.locator("section", { hasText: "The Details" });
  await expect(details.getByText("Gas", { exact: true })).toBeVisible();
  await expect(details.getByText("No", { exact: true }).first()).toBeVisible(); // dishwasher
  await expect(details.getByText("Upstairs bath")).toBeVisible();
  await expect(details.getByText("Claw-foot")).toBeVisible();
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

  // Another landlord cannot even open this walk-through.
  const intruder = await (await browser.newContext()).newPage();
  await signUp(intruder, "intruder2");
  expect((await intruder.goto(walkthroughUrl))?.status()).toBe(404);
});
