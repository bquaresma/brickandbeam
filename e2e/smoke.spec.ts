import { expect, test } from "@playwright/test";

test("landlord lists a property and receives a lead", async ({ page, browser }) => {
  const stamp = Date.now();
  const email = `smoke-${stamp}@example.com`;
  const password = "correct-horse-battery";

  // Sign up, then confirm sign-in tolerates different capitalization.
  await page.goto("/signup");
  await page.locator("#name").fill("Smoke Tester");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/dashboard");

  await page.context().clearCookies();
  await page.goto("/login");
  await page.locator("#email").fill(email.toUpperCase());
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard");

  // Property (whole house is the default).
  await page.goto("/dashboard/properties/new");
  await expect(page.locator('input[name="isWholeHouse"]')).toBeChecked();
  await page.locator("#addressLine1").fill("1 Test Street");
  await page.locator("#city").fill("Pittsburgh");
  await page.locator("#state").fill("PA");
  await page.locator("#zip").fill("15201");
  await page.locator("#buildYear").fill("1900");
  await page.getByRole("button", { name: "Add property" }).click();
  await page.waitForURL(/\/dashboard\/properties\/[^/]+$/);

  // Draft listing, previewable by the owner only.
  await page.getByRole("link", { name: "+ Add listing" }).click();
  await page.locator("#headline").fill("Smoke test house");
  await page.locator("#story").fill("A house with a story.");
  await page.getByRole("button", { name: "Create listing" }).click();
  await page.waitForURL(/\/dashboard\/properties\/[^/]+$/);

  const listingHref = await page
    .locator('a[href^="/listings/"]')
    .first()
    .getAttribute("href");
  expect(listingHref).toBeTruthy();

  await page.goto(listingHref!);
  await expect(page.getByText("not public")).toBeVisible();

  const anonymous = await (await browser.newContext()).newPage();
  const draftResponse = await anonymous.goto(
    new URL(listingHref!, page.url()).toString(),
  );
  expect(draftResponse?.status()).toBe(404);

  // Publish.
  await page.goBack();
  await page.getByRole("link", { name: "Edit listing" }).first().click();
  await page.locator("#status").selectOption("PUBLISHED");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.waitForURL(/\/dashboard\/properties\/[^/]+$/);

  // The public page has no account email in it and accepts a lead.
  const publicUrl = new URL(listingHref!, page.url()).toString();
  await anonymous.goto(publicUrl);
  expect(await anonymous.content()).not.toContain(email);
  await anonymous.locator('input[name="name"]').fill("Prospect");
  await anonymous.locator('input[name="email"]').fill("Prospect@Example.com");
  await anonymous.getByRole("button", { name: "Send Request" }).click();
  await anonymous.waitForURL("**?sent=true");

  // Lead shows up in the landlord inbox, with the email normalized.
  await page.goto("/dashboard/leads");
  await expect(page.getByText("prospect@example.com")).toBeVisible();
});
