import { fallback, mediaUrl, srcSet, type PhotoView } from "@/lib/images/view";

// One stored photo as a <picture>: AVIF, then WebP, then JPEG/PNG for old
// browsers, each with a width ladder so phones fetch small files. width/height
// reserve space so the page doesn't jump while the image loads.
export function ResponsivePicture({
  photo,
  alt,
  sizes,
  priority = false,
  className,
}: {
  photo: PhotoView;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const fb = fallback(photo.variants);
  if (!fb.largest) return null;

  return (
    <picture>
      {srcSet(photo.variants, "avif") && (
        <source type="image/avif" srcSet={srcSet(photo.variants, "avif")} sizes={sizes} />
      )}
      {srcSet(photo.variants, "webp") && (
        <source type="image/webp" srcSet={srcSet(photo.variants, "webp")} sizes={sizes} />
      )}
      <img
        src={mediaUrl(fb.largest.key)}
        srcSet={fb.srcSet}
        sizes={sizes}
        width={photo.width}
        height={photo.height}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : undefined}
        className={className}
        style={
          photo.placeholder
            ? { backgroundImage: `url(${photo.placeholder})`, backgroundSize: "cover" }
            : undefined
        }
      />
    </picture>
  );
}
