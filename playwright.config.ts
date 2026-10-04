import { defineConfig } from "@playwright/test";

// The smoke test runs against its own database so it never touches dev data.
// Override with TEST_DATABASE_URL (CI points it at the Postgres service).
const DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://brickandbeam:brickandbeam@localhost:5432/brickandbeam_test";
const PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL,
      AUTH_SECRET: "e2e-only-secret",
      AUTH_URL: `http://localhost:${PORT}`,
      AUTH_TRUST_HOST: "true",
      NEXT_PUBLIC_MAPBOX_TOKEN: "",
    },
  },
});
