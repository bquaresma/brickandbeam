import { defineConfig } from "@playwright/test";

// The smoke test runs against its own database so it never touches dev data.
// Override with TEST_DATABASE_URL (CI points it at the Postgres service).
const DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://brickandbeam:brickandbeam@localhost:5432/brickandbeam_test";
const PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  // E2E_BASE_URL points the suite at an already-running stack (for example the
  // production-like Docker stack) instead of starting a dev server.
  globalSetup: process.env.E2E_BASE_URL ? undefined : "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npx next dev -p ${PORT}`,
        url: `http://localhost:${PORT}/api/health`,
        reuseExistingServer: false,
        timeout: 120_000,
        env: {
          DATABASE_URL,
          AUTH_SECRET: "e2e-only-secret",
          AUTH_URL: `http://localhost:${PORT}`,
          AUTH_TRUST_HOST: "true",
          // The review-queue test signs in as this admin.
          ADMIN_EMAILS: "e2e-admin@example.com",
          NEXT_PUBLIC_MAPBOX_TOKEN: "",
        },
      },
});
