// Single place that decides what an email address looks like once stored or
// compared, so signup, sign-in and lead capture can't drift apart.
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}
