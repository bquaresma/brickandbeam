"use client";

export default function RootError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
      <h1 className="text-xl font-semibold text-stone-900">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-sm text-stone-500">
        {error.message || "That didn't go through. Give it another try."}
      </p>
      <button
        onClick={() => retry()}
        className="mt-6 rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
      >
        Try again
      </button>
    </div>
  );
}
