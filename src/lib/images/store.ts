import { randomBytes } from "node:crypto";

import { getStorage } from "../adapters/storage";
import {
  contentTypeFor,
  processImage,
  type PhotoKindName,
  type Variant,
} from "./process";
import { runExclusive } from "./exclusive";
import type { StoredVariant } from "./view";

export type StoredPhoto = {
  photoId: string;
  masterKey: string;
  contentType: string;
  bytes: number;
  width: number;
  height: number;
  placeholder: string;
  variants: StoredVariant[];
};

export const newPhotoId = () => randomBytes(12).toString("hex");

// Variants are served with immutable caching, so each live set sits in its own
// folder named after a hash of the master + presets.
//   listings/<listingId>/<photoId>/master.jpg          (private)
//   listings/<listingId>/<photoId>/<hash>/display-800.avif
const folder = (listingId: string, photoId: string) => `listings/${listingId}/${photoId}`;

// Convert (one at a time) and write the master and every variant. Cleans up
// after itself if anything fails part-way.
export async function convertAndStore(
  listingId: string,
  photoId: string,
  input: Buffer,
  kind: PhotoKindName,
): Promise<StoredPhoto> {
  const processed = await runExclusive(() => processImage(input, kind));
  const storage = getStorage();
  const base = folder(listingId, photoId);
  const masterKey = `${base}/master.${processed.masterFormat === "png" ? "png" : "jpg"}`;
  const written: string[] = [];

  try {
    await storage.put(masterKey, processed.master, {
      contentType: processed.masterFormat === "png" ? "image/png" : "image/jpeg",
    });
    written.push(masterKey);

    const variants: StoredVariant[] = [];
    for (const v of processed.variants) {
      const key = `${base}/${processed.hash}/${v.file}`;
      await storage.put(key, v.buffer, { contentType: contentTypeFor(v.format) });
      written.push(key);
      variants.push(toStored(v, key));
    }

    return {
      photoId,
      masterKey,
      contentType: processed.masterFormat === "png" ? "image/png" : "image/jpeg",
      bytes: processed.master.length,
      width: processed.width,
      height: processed.height,
      placeholder: processed.placeholder,
      variants,
    };
  } catch (error) {
    await Promise.all(written.map((key) => storage.delete(key).catch(() => undefined)));
    throw error;
  }
}

const toStored = (v: Variant, key: string): StoredVariant => ({
  preset: v.preset,
  width: v.width,
  height: v.height,
  format: v.format,
  key,
  bytes: v.buffer.length,
});

export async function deleteStored(photo: { masterKey: string; variants: unknown }) {
  const storage = getStorage();
  const keys = [
    photo.masterKey,
    ...(photo.variants as StoredVariant[]).map((v) => v.key),
  ];
  await Promise.all(keys.map((key) => storage.delete(key)));
}
