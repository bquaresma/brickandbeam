import { execSync } from "node:child_process";

// Bring the dedicated test database up to the current migrations. Non-
// destructive on purpose: each run signs up a fresh user, so no wipe is needed.
export default function globalSetup() {
  const url =
    process.env.TEST_DATABASE_URL ??
    "postgresql://brickandbeam:brickandbeam@localhost:5432/brickandbeam_test";
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url },
  });
}
