"use client";

export default function DashboardError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="rounded-lg border border-[#e7d9c3] bg-white p-8 text-center">
      <h1 className="text-lg font-semibold text-[#3D2E24]">Something went wrong</h1>
      <p className="mt-1 text-sm text-stone-500">
        {error.message || "That action didn't go through. Give it another try."}
      </p>
      <button
        onClick={() => retry()}
        className="mt-5 rounded-md bg-[#B1502F] px-4 py-2 text-sm font-medium text-white hover:bg-[#8F3F25]"
      >
        Try again
      </button>
    </div>
  );
}
