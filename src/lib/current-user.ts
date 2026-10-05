import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";

export async function requireLandlord() {
  const session = await auth();

  if (!session?.user || session.user.role !== "LANDLORD") {
    redirect("/login");
  }

  return session.user;
}

// For the review queue. Anyone who isn't an admin gets a 404, so the page's
// existence isn't revealed.
export async function requireAdmin() {
  const user = await requireLandlord();
  if (!isAdminEmail(user.email)) notFound();
  return user;
}
