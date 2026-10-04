// Client-safe helpers: how a stored photo turns into <picture> sources and
// admin-UI fields. No Node or Prisma imports, so components can use it freely.
export const PHOTO_AREAS = [
  "EXTERIOR",
  "LIVING",
  "KITCHEN",
  "BATHROOM",
  "BEDROOM",
  "BASEMENT",
  "ATTIC",
  "OUTDOOR",
  "DETAIL",
  "OTHER",
] as const;
export type PhotoAreaName = (typeof PHOTO_AREAS)[number];

export const AREA_LABELS: Record<PhotoAreaName, string> = {
  EXTERIOR: "Exterior",
  LIVING: "Living spaces",
  KITCHEN: "Kitchen",
  BATHROOM: "Bathroom",
  BEDROOM: "Bedroom",
  BASEMENT: "Basement",
  ATTIC: "Attic",
  OUTDOOR: "Yard & outdoors",
  DETAIL: "Details",
  OTHER: "Other",
};

export type StoredVariant = {
  preset: "display" | "plan" | "share" | "export";
  width: number;
  height: number;
  format: "avif" | "webp" | "jpeg" | "png";
  key: string;
  bytes: number;
};

export type PhotoView = {
  id: string;
  kind: "PHOTO" | "FLOOR_PLAN";
  area: PhotoAreaName;
  level: string | null;
  caption: string | null;
  altText: string | null;
  isHero: boolean;
  sortOrder: number;
  width: number;
  height: number;
  placeholder: string | null;
  variants: StoredVariant[];
};

type PhotoRow = Omit<PhotoView, "variants" | "area" | "kind"> & {
  area: string;
  kind: string;
  variants: unknown;
};

export function toPhotoView(row: PhotoRow): PhotoView {
  return {
    id: row.id,
    kind: row.kind as PhotoView["kind"],
    area: row.area as PhotoAreaName,
    level: row.level,
    caption: row.caption,
    altText: row.altText,
    isHero: row.isHero,
    sortOrder: row.sortOrder,
    width: row.width,
    height: row.height,
    placeholder: row.placeholder,
    variants: row.variants as StoredVariant[],
  };
}

export const mediaUrl = (key: string) => `/media/${key}`;

// Alt text: what the landlord wrote, else the caption, else the area.
export function altFor(
  photo: Pick<PhotoView, "altText" | "caption" | "area">,
  fallback = "",
) {
  return photo.altText || photo.caption || `${AREA_LABELS[photo.area]}${fallback}`;
}

export function srcSet(variants: StoredVariant[], format: StoredVariant["format"]) {
  return variants
    .filter((v) => v.format === format && v.preset !== "share" && v.preset !== "export")
    .sort((a, b) => a.width - b.width)
    .map((v) => `${mediaUrl(v.key)} ${v.width}w`)
    .join(", ");
}

// The universally supported fallback: JPEG for photos, PNG for floor plans.
export function fallback(variants: StoredVariant[]) {
  const format = variants.some((v) => v.format === "jpeg") ? "jpeg" : "png";
  const sorted = variants
    .filter((v) => v.format === format && v.preset !== "share" && v.preset !== "export")
    .sort((a, b) => a.width - b.width);
  return { format, largest: sorted[sorted.length - 1], srcSet: srcSet(variants, format) };
}

export function smallestUrl(variants: StoredVariant[]) {
  const first = variants
    .filter((v) => v.preset === "display" || v.preset === "plan")
    .sort((a, b) => a.width - b.width)[0];
  return first ? mediaUrl(first.key) : undefined;
}
