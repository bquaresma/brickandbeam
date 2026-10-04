import type { PhotoView } from "@/lib/images/view";

// Browser-side helpers shared by the photo and floor-plan uploaders.
export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";

export const looksLikeHeic = (file: File) =>
  /image\/hei[cf]/.test(file.type) || /\.(heic|heif)$/i.test(file.name);

// XHR rather than fetch so each file reports real upload progress.
export function sendFile(
  file: File,
  fields: Record<string, string>,
  onProgress: (fraction: number) => void,
): Promise<{ photo?: PhotoView; error?: string }> {
  return new Promise((resolve) => {
    const body = new FormData();
    body.set("file", file);
    for (const [key, value] of Object.entries(fields)) body.set(key, value);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/uploads");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onerror = () =>
      resolve({ error: "The upload was interrupted. Check your connection." });
    xhr.onload = () => {
      try {
        resolve(JSON.parse(xhr.responseText));
      } catch {
        resolve({ error: "The server sent an unexpected response." });
      }
    };
    xhr.send(body);
  });
}
