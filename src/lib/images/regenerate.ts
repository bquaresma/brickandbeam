import type { StorageAdapter } from "../adapters/storage/types";
import { contentTypeFor, processImage, type PhotoKindName } from "./process";
import { runExclusive } from "./exclusive";
import type { StoredVariant } from "./view";

export type RegenerateInput = {
  listingId: string;
  id: string;
  kind: PhotoKindName;
  masterKey: string;
  variants: StoredVariant[];
};

export type RegenerateResult = {
  variants: StoredVariant[];
  placeholder: string;
};

// Rebuild every served variant from the stored master — used when the presets
// change. New files are written before old ones are removed, so a failure
// never leaves a photo without images. The master itself is never touched.
export async function regenerateVariants(
  storage: StorageAdapter,
  photo: RegenerateInput,
): Promise<RegenerateResult> {
  const master = await storage.get(photo.masterKey);
  if (!master) throw new Error(`Master missing for photo ${photo.id}`);

  const processed = await runExclusive(() => processImage(master.body, photo.kind));
  const base = `listings/${photo.listingId}/${photo.id}/${processed.hash}`;

  const variants: StoredVariant[] = [];
  for (const v of processed.variants) {
    const key = `${base}/${v.file}`;
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

  // Remove old files that the new set doesn't reuse.
  const keep = new Set(variants.map((v) => v.key));
  await Promise.all(
    photo.variants.filter((v) => !keep.has(v.key)).map((v) => storage.delete(v.key)),
  );

  return { variants, placeholder: processed.placeholder };
}
