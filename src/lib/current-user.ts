import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export async function requireLandlord() {
  const session = await auth();

  if (!session?.user || session.user.role !== "LANDLORD") {
    redirect("/login");
  }

  return session.user;
}
