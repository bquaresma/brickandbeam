"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { LeadStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireLandlord } from "@/lib/current-user";
import { EMAIL_RE, normalizeEmail } from "@/lib/email";
import type { ActionResult } from "@/lib/actions/action-result";

// Field length caps; anything longer is rejected rather than truncated.
const LEAD_LIMITS = { name: 100, email: 254, phone: 40, message: 2000 } as const;
const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;

// Public — submitted by an unauthenticated prospective renter from a
// listing page, so this intentionally does not call requireLandlord().
export async function createLead(
  listingId: string,
  formData: FormData,
): Promise<ActionResult> {
  // Honeypot: real visitors never see or fill this field. Pretend success so a
  // bot learns nothing, but store nothing.
  if (String(formData.get("website") ?? "").trim()) {
    redirect(`/listings/${listingId}?sent=true`);
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = normalizeEmail(formData.get("email"));
  const phone = String(formData.get("phone") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (
    name.length > LEAD_LIMITS.name ||
    email.length > LEAD_LIMITS.email ||
    phone.length > LEAD_LIMITS.phone ||
    message.length > LEAD_LIMITS.message
  ) {
    return { error: "One of your answers is too long. Please shorten it and try again." };
  }
  if (!name) return { error: "Enter your name." };
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.status !== "PUBLISHED") {
    return { error: "This listing is no longer accepting inquiries." };
  }

  // A double-click or retry shouldn't create a second inbox row: the same
  // person re-submitting for the same listing within 10 minutes is treated as
  // a success without a new lead.
  const duplicate = await prisma.lead.findFirst({
    where: {
      listingId,
      email,
      createdAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
    },
    select: { id: true },
  });
  if (duplicate) redirect(`/listings/${listingId}?sent=true`);

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
