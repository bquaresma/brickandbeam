// Identify an upload by its first bytes rather than by what the browser
// claims, and say clearly when we can't handle it.
export type SourceFormat = "jpeg" | "png" | "webp" | "heic";

export const MAX_UPLOAD_BYTES = 30 * 1024 * 1024;
export const MAX_INPUT_PIXELS = 100_000_000;

// Brands that mark a HEIC/HEIF file (what iPhones produce by default).
const HEIC_BRANDS = new Set([
  "heic",
  "heix",
  "hevc",
  "hevx",
  "heim",
  "heis",
  "mif1",
  "msf1",
]);

const ascii = (bytes: Uint8Array, from: number, to: number) =>
  String.fromCharCode(...bytes.slice(from, to));

export function detectFormat(bytes: Uint8Array): SourceFormat | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (bytes[0] === 0x89 && ascii(bytes, 1, 4) === "PNG") return "png";
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") return "webp";
  if (ascii(bytes, 4, 8) === "ftyp" && HEIC_BRANDS.has(ascii(bytes, 8, 12)))
    return "heic";
  return null;
}

// Thrown for problems the uploader can fix; the message is shown to them.
export class ImageError extends Error {
  constructor(
    message: string,
    readonly code: "heic" | "unsupported" | "too-large" | "corrupt",
  ) {
    super(message);
  }
}

export const HEIC_MESSAGE =
  "This looks like an iPhone HEIC photo, which we can't read yet. On the iPhone, share the photo " +
  "from Photos and choose Options → Most Compatible (or set Settings → Camera → Formats → " +
  "Most Compatible), then upload the JPEG.";
