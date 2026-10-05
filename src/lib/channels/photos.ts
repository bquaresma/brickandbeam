import { AREA_LABELS, type PhotoAreaName, type StoredVariant } from "../images/view";

export type KitPhoto = {
  kind: "PHOTO" | "FLOOR_PLAN";
  area: PhotoAreaName;
  level: string | null;
  isHero: boolean;
  sortOrder: number;
  variants: StoredVariant[];
};

export type ZipEntry = { name: string; key: string };

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// The file to upload to a listing site: the 2048 px export, falling back to the
// largest JPEG display size. Floor plans keep their lossless PNG.
function pickKey(photo: KitPhoto): string | null {
  if (photo.kind === "FLOOR_PLAN") {
    const plans = photo.variants
      .filter((v) => v.format === "png")
      .sort((a, b) => b.width - a.width);
    return plans[0]?.key ?? null;
  }
  const exported = photo.variants.find((v) => v.preset === "export");
  if (exported) return exported.key;
  const display = photo.variants
    .filter((v) => v.preset === "display" && v.format === "jpeg")
    .sort((a, b) => b.width - a.width);
  return display[0]?.key ?? null;
}

// Hero first, then the landlord's order, numbered so the first N files are the
// first N photos a site shows; floor plans go last.
export function zipEntries(photos: KitPhoto[]): ZipEntry[] {
  const regular = photos
    .filter((p) => p.kind === "PHOTO")
    .sort((a, b) => Number(b.isHero) - Number(a.isHero) || a.sortOrder - b.sortOrder);
  const plans = photos.filter((p) => p.kind === "FLOOR_PLAN");

  const entries: ZipEntry[] = [];
  regular.forEach((photo, i) => {
    const key = pickKey(photo);
    if (!key) return;
    const number = String(i + 1).padStart(2, "0");
    entries.push({
      name: `${number}-${slug(AREA_LABELS[photo.area])}${photo.isHero ? "-hero" : ""}.jpg`,
      key,
    });
  });
  plans.forEach((photo) => {
    const key = pickKey(photo);
    if (key) entries.push({ name: `floor-plan-${slug(photo.level || "main")}.png`, key });
  });
  return entries;
}
