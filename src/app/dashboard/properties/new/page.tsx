import { PropertyForm } from "@/components/property-form";
import { createProperty } from "@/lib/actions/properties";

export default function NewPropertyPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#3D2E24]">Add a property</h1>
      <div className="mt-6">
        <PropertyForm action={createProperty} submitLabel="Add property" />
      </div>
    </div>
  );
}
