import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { localStorageAdapter } from "../adapters/storage/local";
import { contentTypeFor, processImage } from "./process";
import { regenerateVariants } from "./regenerate";
import type { StoredVariant } from "./view";

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), "bb-regen-"));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("regenerateVariants", () => {
  it("rebuilds missing variants from the master and leaves the master alone", async () => {
    const storage = localStorageAdapter(dir);
    const input = await sharp({
      create: { width: 1600, height: 1000, channels: 3, background: "#a55" },
    })
      .jpeg()
      .toBuffer();

    // Store a photo the way the upload route does.
    const processed = await processImage(input, "PHOTO");
    const masterKey = "listings/l1/p1/master.jpg";
    await storage.put(masterKey, processed.master, { contentType: "image/jpeg" });
    const variants: StoredVariant[] = [];
    for (const v of processed.variants) {
      const key = `listings/l1/p1/${processed.hash}/${v.file}`;
      await storage.put(key, v.buffer, { contentType: contentTypeFor(v.format) });
      variants.push({
        preset: v.preset,
        width: v.width,
        height: v.height,
        format: v.format,
        key,
        bytes: v.buffer.length,
      });
    }

    // Lose a file, then regenerate.
    await storage.delete(variants[0].key);
    expect(await storage.get(variants[0].key)).toBeNull();

    const result = await regenerateVariants(storage, {
      id: "p1",
      listingId: "l1",
      kind: "PHOTO",
      masterKey,
      variants,
    });

    expect(result.variants.map((v) => v.key).sort()).toEqual(
      variants.map((v) => v.key).sort(),
    );
    for (const v of result.variants) expect(await storage.get(v.key)).not.toBeNull();
    expect((await storage.get(masterKey))?.body.equals(processed.master)).toBe(true);
    expect(result.placeholder.startsWith("data:image/webp")).toBe(true);
  });

  it("fails clearly when the master is missing", async () => {
    await expect(
      regenerateVariants(localStorageAdapter(dir), {
        id: "gone",
        listingId: "l1",
        kind: "PHOTO",
        masterKey: "listings/l1/gone/master.jpg",
        variants: [],
      }),
    ).rejects.toThrow(/Master missing/);
  });
});
