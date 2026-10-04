import { describe, expect, it } from "vitest";

import { detectFormat } from "./formats";

const bytes = (...values: number[]) =>
  Uint8Array.from([...values, ...new Array(32).fill(0)]);
const text = (s: string) => [...s].map((c) => c.charCodeAt(0));

describe("detectFormat", () => {
  it("recognizes JPEG, PNG and WebP by magic bytes", () => {
    expect(detectFormat(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("jpeg");
    expect(detectFormat(bytes(0x89, ...text("PNG")))).toBe("png");
    expect(detectFormat(bytes(...text("RIFF"), 0, 0, 0, 0, ...text("WEBP")))).toBe(
      "webp",
    );
  });

  it("recognizes HEIC by its ftyp brand", () => {
    for (const brand of ["heic", "heix", "mif1"]) {
      expect(detectFormat(bytes(0, 0, 0, 0x20, ...text("ftyp"), ...text(brand)))).toBe(
        "heic",
      );
    }
  });

  it("returns null for anything else", () => {
    expect(detectFormat(bytes(...text("GIF89a")))).toBeNull();
    expect(detectFormat(bytes(...text("%PDF-1.7")))).toBeNull();
    expect(detectFormat(Uint8Array.from([1, 2, 3]))).toBeNull();
  });
});
