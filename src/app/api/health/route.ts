import { NextResponse } from "next/server";

// Liveness check for the ALB target group — intentionally does not touch the
// database, so a slow/unavailable DB doesn't get reported as the app being down.
export function GET() {
  return NextResponse.json({ status: "ok" });
}
