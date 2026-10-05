"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-md bg-[#B1502F] px-4 py-2 text-sm font-medium text-white hover:bg-[#8F3F25]"
    >
      Print or save as PDF
    </button>
  );
}
