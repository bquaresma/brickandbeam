import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireLandlord } from "@/lib/current-user";
import { markLeadStatus, deleteLead } from "@/lib/actions/leads";

const STATUS_STYLES: Record<string, string> = {
  NEW: "bg-green-100 text-green-800",
  CONTACTED: "bg-stone-100 text-stone-700",
  ARCHIVED: "bg-stone-100 text-stone-400",
};

export default async function LeadsInboxPage() {
  const user = await requireLandlord();

  const leads = await prisma.lead.findMany({
    where: { listing: { unit: { property: { landlordId: user.id } } } },
    include: {
      listing: {
        include: {
          unit: { include: { property: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#3D2E24]">Leads</h1>
      <p className="mt-1 text-sm text-stone-500">
        Inquiries from all of your published listings, newest first.
      </p>

      {leads.length === 0 ? (
        <p className="mt-8 text-sm text-stone-500">
          No inquiries yet. They&apos;ll show up here as soon as someone reaches out from
          a listing page.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
          {leads.map((lead) => {
            const { listing } = lead;
            const { unit } = listing;
            const { property } = unit;
            return (
              <li key={lead.id} className="px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[lead.status]}`}
                      >
                        {lead.status}
                      </span>
                      <span className="font-medium text-stone-900">{lead.name}</span>
                    </div>
                    <p className="mt-1 text-sm text-stone-500">
                      <a href={`mailto:${lead.email}`} className="hover:underline">
                        {lead.email}
                      </a>
                      {lead.phone ? ` · ${lead.phone}` : ""}
                    </p>
                    {lead.message && (
                      <p className="mt-2 max-w-xl text-sm text-stone-700">
                        {lead.message}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-stone-400">
                      {listing.headline || unit.name} — {property.addressLine1},{" "}
                      {property.city}, {property.state} ·{" "}
                      {lead.createdAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <Link
                      href={`/listings/${listing.id}`}
                      target="_blank"
                      className="mt-1 inline-block text-xs text-stone-500 underline"
                    >
                      View listing
                    </Link>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <div className="flex gap-1.5">
                      {lead.status !== "NEW" && (
                        <form action={markLeadStatus.bind(null, lead.id, "NEW")}>
                          <button
                            type="submit"
                            className="rounded-md border border-stone-300 px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50"
                          >
                            Mark new
                          </button>
                        </form>
                      )}
                      {lead.status !== "CONTACTED" && (
                        <form action={markLeadStatus.bind(null, lead.id, "CONTACTED")}>
                          <button
                            type="submit"
                            className="rounded-md border border-stone-300 px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50"
                          >
                            Mark contacted
                          </button>
                        </form>
                      )}
                      {lead.status !== "ARCHIVED" && (
                        <form action={markLeadStatus.bind(null, lead.id, "ARCHIVED")}>
                          <button
                            type="submit"
                            className="rounded-md border border-stone-300 px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50"
                          >
                            Archive
                          </button>
                        </form>
                      )}
                    </div>
                    <form action={deleteLead.bind(null, lead.id)}>
                      <button
                        type="submit"
                        className="text-xs font-medium text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
