"use client";

import { useEffect } from "react";

// While `dirty` is true, closing or reloading the tab asks for confirmation, so
// typing that hasn't been saved isn't lost by accident.
export function useUnsavedWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
}
