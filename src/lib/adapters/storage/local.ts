import { promises as fs } from "node:fs";
import path from "node:path";

import type { StorageAdapter } from "./types";

// Keys look like "listings/<id>/photo-1-800.jpg": lowercase segments joined by
// "/", no dots-only segments, so a key can never escape the storage root.
const KEY_RE = /^[a-z0-9][a-z0-9._-]*(\/[a-z0-9][a-z0-9._-]*)*$/i;

export function localStorageAdapter(root: string): StorageAdapter {
  const base = path.resolve(root);

  function resolveKey(key: string) {
    if (!KEY_RE.test(key) || key.includes("..")) {
      throw new Error(`Invalid storage key: ${key}`);
    }
    const file = path.resolve(base, key);
    if (!file.startsWith(base + path.sep)) {
      throw new Error(`Invalid storage key: ${key}`);
    }
    return file;
  }

  return {
    async put(key, body, { contentType }) {
      const file = resolveKey(key);
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, body);
      await fs.writeFile(`${file}.meta.json`, JSON.stringify({ contentType }));
    },

    async get(key) {
      const file = resolveKey(key);
      try {
        const [body, meta] = await Promise.all([
          fs.readFile(file),
          fs.readFile(`${file}.meta.json`, "utf8"),
        ]);
        return { body, contentType: JSON.parse(meta).contentType as string };
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
        throw error;
      }
    },

    async delete(key) {
      const file = resolveKey(key);
      await Promise.all([
        fs.rm(file, { force: true }),
        fs.rm(`${file}.meta.json`, { force: true }),
      ]);
    },
  };
}
