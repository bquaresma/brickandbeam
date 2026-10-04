import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { ImageError } from "./formats";
import { processImage } from "./process";

const solid = (width: number, height: number) =>
  sharp({
    create: { width, height, channels: 3, background: { r: 200, g: 100, b: 50 } },
  });

describe("processImage — photos", () => {
  it("builds the display ladder, share crop and export for a large photo", async () => {
    const input = await solid(3000, 2000).jpeg().toBuffer();
    const result = await processImage(input, "PHOTO");

    const display = result.variants.filter((v) => v.preset === "display");
    expect([...new Set(display.map((v) => v.width))]).toEqual([400, 800, 1200, 1600]);
    for (const width of [400, 800, 1200, 1600]) {
      expect(
        display
          .filter((v) => v.width === width)
          .map((v) => v.format)
          .sort(),
      ).toEqual(["avif", "jpeg", "webp"]);
    }
    expect(result.variants.find((v) => v.preset === "share")).toMatchObject({
      width: 1200,
      height: 630,
    });
    expect(result.variants.find((v) => v.preset === "export")?.width).toBe(2048);
    expect(result.placeholder.startsWith("data:image/webp;base64,")).toBe(true);
    expect(result.masterFormat).toBe("jpeg");
  });

  it("never enlarges a small photo", async () => {
    const input = await solid(500, 300).jpeg().toBuffer();
    const result = await processImage(input, "PHOTO");

    expect(Math.max(...result.variants.map((v) => v.width))).toBeLessThanOrEqual(500);
    expect([
      ...new Set(
        result.variants.filter((v) => v.preset === "display").map((v) => v.width),
      ),
    ]).toEqual([400, 500]);
    expect(result.variants.some((v) => v.preset === "share")).toBe(false);
  });

  it("strips GPS and every other metadata block from the master and all variants", async () => {
    const input = await solid(1600, 1200)
      .withExif({
        IFD0: { Copyright: "secret owner" },
        IFD3: {
          GPSLatitudeRef: "N",
          GPSLatitude: "40/1 28/1 0/1",
          GPSLongitudeRef: "W",
          GPSLongitude: "79/1 57/1 0/1",
        },
      })
      .jpeg()
      .toBuffer();
    expect((await sharp(input).metadata()).exif).toBeDefined();

    const result = await processImage(input, "PHOTO");
    for (const file of [result.master, ...result.variants.map((v) => v.buffer)]) {
      const meta = await sharp(file).metadata();
      expect(meta.exif).toBeUndefined();
      expect(meta.xmp).toBeUndefined();
      expect(meta.iptc).toBeUndefined();
    }
    expect(result.master.includes(Buffer.from("secret owner"))).toBe(false);
  });

  it("applies EXIF orientation instead of carrying it", async () => {
    const input = await solid(1200, 800)
      .withMetadata({ orientation: 6 })
      .jpeg()
      .toBuffer();
    const result = await processImage(input, "PHOTO");

    expect(result.width).toBe(800);
    expect(result.height).toBe(1200);
    expect((await sharp(result.master).metadata()).orientation).toBeUndefined();
  });

  it("converts wide-gamut color into sRGB", async () => {
    // withIccProfile writes the pixels in Display P3 encoding and tags the file.
    const input = await solid(800, 800)
      .withIccProfile("p3")
      .jpeg({ quality: 100 })
      .toBuffer();
    expect((await sharp(input).metadata()).icc).toBeDefined();

    const result = await processImage(input, "PHOTO");

    // A color-managed conversion lands back on the original sRGB color (200, 100, 50);
    // ignoring the profile would leave the P3-encoded numbers, which are far off.
    const raw = await sharp(result.master).raw().toBuffer();
    expect(Math.abs(raw[0] - 200)).toBeLessThan(8);
    expect(Math.abs(raw[1] - 100)).toBeLessThan(8);
    expect(Math.abs(raw[2] - 50)).toBeLessThan(8);
    expect((await sharp(result.master).metadata()).icc).toBeUndefined();
  });

  it("produces files browsers can decode", async () => {
    const result = await processImage(await solid(900, 600).png().toBuffer(), "PHOTO");
    for (const variant of result.variants) {
      const meta = await sharp(variant.buffer).metadata();
      expect(meta.width).toBe(variant.width);
      expect(meta.height).toBe(variant.height);
      if (variant.format === "avif") expect(meta.compression).toBe("av1");
    }
  });
});

describe("processImage — floor plans", () => {
  it("keeps line art lossless and uncropped", async () => {
    const result = await processImage(
      await solid(3200, 2400).png().toBuffer(),
      "FLOOR_PLAN",
    );

    expect(result.masterFormat).toBe("png");
    expect(result.variants.every((v) => v.preset === "plan")).toBe(true);
    expect([...new Set(result.variants.map((v) => v.width))]).toEqual([800, 1600, 2400]);
    expect(new Set(result.variants.map((v) => v.format))).toEqual(
      new Set(["webp", "png"]),
    );
    expect(result.variants.find((v) => v.width === 800)).toMatchObject({ height: 600 });
  });
});

describe("processImage — rejects what it can't handle", () => {
  it("explains HEIC", async () => {
    const heic = Buffer.alloc(64);
    heic.write("ftyp", 4, "ascii");
    heic.write("heic", 8, "ascii");

    await expect(processImage(heic, "PHOTO")).rejects.toMatchObject({
      name: "Error",
      code: "heic",
      message: expect.stringContaining("Most Compatible"),
    });
  });

  it("rejects unsupported and oversized files", async () => {
    await expect(
      processImage(Buffer.from("GIF89a-not-supported-here"), "PHOTO"),
    ).rejects.toMatchObject({
      code: "unsupported",
    });
    await expect(
      processImage(Buffer.alloc(31 * 1024 * 1024), "PHOTO"),
    ).rejects.toBeInstanceOf(ImageError);
  });

  it("reports a damaged image instead of crashing", async () => {
    const damaged = Buffer.concat([
      Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
      Buffer.alloc(100, 1),
    ]);
    await expect(processImage(damaged, "PHOTO")).rejects.toMatchObject({
      code: "corrupt",
    });
  });
});
