"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { LeadStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireLandlord } from "@/lib/current-user";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Public — submitted by an unauthenticated prospective renter from a
// listing page, so this intentionally does not call requireLandlord().
export async function createLead(listingId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name) throw new Error("Enter your name.");
  if (!EMAIL_RE.test(email)) throw new Error("Enter a valid email address.");

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.status !== "PUBLISHED") {
    throw new Error("This listing is no longer accepting inquiries.");
  }

  await prisma.lead.create({
    data: {
      listingId,
      name,
      email,
      phone: phone || null,
      message: message || null,
    },
  });

  redirect(`/listings/${listingId}?sent=true`);
}

async function assertOwnsLead(leadId: string, landlordId: string) {
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, listing: { unit: { property: { landlordId } } } },
  });
  if (!lead) throw new Error("Lead not found.");
  return lead;
}

export async function markLeadStatus(leadId: string, status: string) {
  const user = await requireLandlord();
  await assertOwnsLead(leadId, user.id);

  if (!Object.values(LeadStatus).includes(status as LeadStatus)) {
    throw new Error("Invalid status.");
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: { status: status as LeadStatus },
  });

  revalidatePath("/dashboard/leads");
}

export async function deleteLead(leadId: string) {
  const user = await requireLandlord();
  await assertOwnsLead(leadId, user.id);

  await prisma.lead.delete({ where: { id: leadId } });

  revalidatePath("/dashboard/leads");
}
