import { createHash } from "node:crypto";

import sharp, { type OutputInfo, type Sharp } from "sharp";

import {
  detectFormat,
  HEIC_MESSAGE,
  ImageError,
  MAX_INPUT_PIXELS,
  MAX_UPLOAD_BYTES,
} from "./formats";

// Bump when presets change so regenerated files get new keys (they are served
// with immutable caching).
export const PRESET_VERSION = "p1";

export type PhotoKindName = "PHOTO" | "FLOOR_PLAN";
export type Variant = {
  preset: "display" | "plan" | "share" | "export";
  width: number;
  height: number;
  format: "avif" | "webp" | "jpeg" | "png";
  // Path relative to the photo's folder, e.g. "display-800.avif".
  file: string;
  buffer: Buffer;
};
export type ProcessedImage = {
  master: Buffer;
  masterFormat: "jpeg" | "png";
  width: number;
  height: number;
  variants: Variant[];
  placeholder: string;
  hash: string;
};

const MASTER_EDGE = 3000;
const DISPLAY_WIDTHS = [400, 800, 1200, 1600];
const PLAN_WIDTHS = [800, 1600, 2400];

const CONTENT_TYPES = {
  avif: "image/avif",
  webp: "image/webp",
  jpeg: "image/jpeg",
  png: "image/png",
} as const;
export const contentTypeFor = (format: Variant["format"]) => CONTENT_TYPES[format];

// Widths up to the source width, never enlarging, always at least one.
function ladder(widths: number[], sourceWidth: number) {
  return [...new Set(widths.map((w) => Math.min(w, sourceWidth)))];
}

// Decode ONCE to raw sRGB pixels, then derive every variant from them. Decoding
// the master again for each size was ~8x slower in the spike.
export async function processImage(
  input: Buffer,
  kind: PhotoKindName,
): Promise<ProcessedImage> {
  if (input.length > MAX_UPLOAD_BYTES) {
    throw new ImageError("That file is larger than 30 MB.", "too-large");
  }
  const detected = detectFormat(input);
  if (detected === "heic") throw new ImageError(HEIC_MESSAGE, "heic");
  if (!detected) {
    throw new ImageError("Upload a JPEG, PNG or WebP image.", "unsupported");
  }

  sharp.cache(false);
  sharp.concurrency(1);

  let data: Buffer;
  let info: OutputInfo;
  try {
    ({ data, info } = await sharp(input, {
      limitInputPixels: MAX_INPUT_PIXELS,
      failOn: "error",
    })
      .rotate() // honour EXIF orientation, then drop it
      .toColorspace("srgb")
      .removeAlpha()
      .resize({
        width: MASTER_EDGE,
        height: MASTER_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .raw()
      .toBuffer({ resolveWithObject: true }));
  } catch {
    throw new ImageError(
      "We couldn't read that image. It may be damaged or extremely large.",
      "corrupt",
    );
  }

  const pixels = () => sharp(data, { raw: info });
  const isPlan = kind === "FLOOR_PLAN";
  const variants: Variant[] = [];

  const push = async (
    preset: Variant["preset"],
    format: Variant["format"],
    file: string,
    pipeline: Sharp,
  ) => {
    const { data: buffer, info: out } = await pipeline.toBuffer({
      resolveWithObject: true,
    });
    variants.push({ preset, format, file, buffer, width: out.width, height: out.height });
  };

  if (isPlan) {
    // Line art: no cropping and no lossy JPEG artifacts.
    for (const width of ladder(PLAN_WIDTHS, info.width)) {
      const resized = () => pixels().resize({ width, withoutEnlargement: true });
      await push(
        "plan",
        "webp",
        `plan-${width}.webp`,
        resized().webp({ lossless: true }),
      );
      await push(
        "plan",
        "png",
        `plan-${width}.png`,
        resized().png({ compressionLevel: 9 }),
      );
    }
  } else {
    for (const width of ladder(DISPLAY_WIDTHS, info.width)) {
      const resized = () => pixels().resize({ width, withoutEnlargement: true });
      await push(
        "display",
        "avif",
        `display-${width}.avif`,
        resized().avif({ quality: 50, effort: 3 }),
      );
      await push(
        "display",
        "webp",
        `display-${width}.webp`,
        resized().webp({ quality: 75 }),
      );
      await push(
        "display",
        "jpeg",
        `display-${width}.jpg`,
        resized().jpeg({ quality: 78, progressive: true }),
      );
    }
    // Link-preview crop (used once the site has a public URL).
    if (info.width >= 1200 && info.height >= 630) {
      await push(
        "share",
        "jpeg",
        "share-1200x630.jpg",
        pixels()
          .resize(1200, 630, { fit: "cover", position: sharp.strategy.attention })
          .jpeg({ quality: 80, progressive: true }),
      );
    }
    // Sized for uploading to the listing sites (channel kit).
    await push(
      "export",
      "jpeg",
      "export-2048.jpg",
      pixels()
        .resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 82 }),
    );
  }

  const masterFormat = isPlan ? "png" : "jpeg";
  const master = await (
    isPlan ? pixels().png({ compressionLevel: 9 }) : pixels().jpeg({ quality: 90 })
  ).toBuffer();

  const tiny = await pixels().resize({ width: 24 }).webp({ quality: 30 }).toBuffer();

  return {
    master,
    masterFormat,
    width: info.width,
    height: info.height,
    variants,
    placeholder: `data:image/webp;base64,${tiny.toString("base64")}`,
    hash: createHash("sha256")
      .update(master)
      .update(PRESET_VERSION)
      .digest("hex")
      .slice(0, 10),
  };
}
