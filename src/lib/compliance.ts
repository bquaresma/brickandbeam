// Federal lead-based paint disclosure (Title X) applies to any residential
// property built before 1978. This is the single source of truth for that
// check — the lease/listing flows added in later phases must gate on it.
export function requiresLeadPaintDisclosure(buildYear: number): boolean {
  return buildYear < 1978;
}
