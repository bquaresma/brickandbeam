import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { localStorageAdapter } from "./local";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), "bb-storage-"));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("localStorageAdapter", () => {
  it("round-trips a file with its content type", async () => {
    const storage = localStorageAdapter(dir);
    await storage.put("listings/abc/photo-1.jpg", Buffer.from("jpeg-bytes"), {
      contentType: "image/jpeg",
    });

    const result = await storage.get("listings/abc/photo-1.jpg");
    expect(result?.contentType).toBe("image/jpeg");
    expect(result?.body.toString()).toBe("jpeg-bytes");
  });

  it("returns null for a missing key and deletes idempotently", async () => {
    const storage = localStorageAdapter(dir);
    expect(await storage.get("nope/file.txt")).toBeNull();

    await storage.put("a/b.txt", Buffer.from("x"), { contentType: "text/plain" });
    await storage.delete("a/b.txt");
    await storage.delete("a/b.txt");
    expect(await storage.get("a/b.txt")).toBeNull();
  });

  it("refuses keys that could escape the storage root", async () => {
    const storage = localStorageAdapter(dir);
    for (const key of ["../evil.txt", "/etc/passwd", "a/../../b", "a//b", ""]) {
      await expect(
        storage.put(key, Buffer.from("x"), { contentType: "text/plain" }),
      ).rejects.toThrow(/Invalid storage key/);
    }
  });
});
