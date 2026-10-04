import { localStorageAdapter } from "./local";
import type { StorageAdapter } from "./types";

export type { StorageAdapter } from "./types";

let cached: StorageAdapter | undefined;

// STORAGE_DRIVER selects the backing store. Only "local" exists today; a cloud
// driver is added when there is an environment to test it against.
export function getStorage(): StorageAdapter {
  if (cached) return cached;

  const driver = process.env.STORAGE_DRIVER ?? "local";
  if (driver !== "local") {
    throw new Error(`Unsupported STORAGE_DRIVER "${driver}".`);
  }
  cached = localStorageAdapter(process.env.STORAGE_LOCAL_DIR ?? ".local-storage");
  return cached;
}
