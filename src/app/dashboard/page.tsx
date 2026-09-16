import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireLandlord } from "@/lib/current-user";
import { requiresLeadPaintDisclosure } from "@/lib/compliance";

export default async function DashboardPage() {
  const user = await requireLandlord();

  const properties = await prisma.property.findMany({
    where: { landlordId: user.id },
    include: { units: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#3D2E24]">Your properties</h1>
        <Link
          href="/dashboard/properties/new"
          className="rounded-md bg-[#B1502F] px-4 py-2 text-sm font-medium text-white hover:bg-[#8F3F25]"
        >
          + Add property
        </Link>
      </div>

      {properties.length === 0 ? (
        <p className="mt-8 text-sm text-stone-500">
          No properties yet. Add your first one to get started.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
          {properties.map((property) => (
            <li key={property.id}>
              <Link
                href={`/dashboard/properties/${property.id}`}
                className="flex items-center justify-between px-4 py-4 hover:bg-stone-50"
              >
                <div>
                  <p className="font-medium text-stone-900">
                    {property.name || property.addressLine1}
                  </p>
                  <p className="text-sm text-stone-500">
                    {property.addressLine1}, {property.city}, {property.state}{" "}
                    {property.zip}
                  </p>
                  <p className="mt-1 text-xs text-stone-400">
                    Built {property.buildYear} · {property.units.length}{" "}
                    {property.units.length === 1 ? "unit" : "units"}
                  </p>
                </div>
                {requiresLeadPaintDisclosure(property.buildYear) && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                    Lead-paint disclosure required
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
