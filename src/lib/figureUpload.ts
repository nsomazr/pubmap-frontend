export const FIGURE_MAX_BYTES = 10 * 1024 * 1024;
export const FIGURE_MAX_COUNT = 12;
export const FIGURE_ACCEPT = ".jpg,.jpeg,.png,.gif,.webp";

const FIGURE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"]);

export function figureExtension(file: File): string {
  const fromName = (file.name.match(/\.[^.]+$/)?.[0] || "").toLowerCase();
  if (FIGURE_EXTENSIONS.has(fromName)) return fromName;
  const mime = (file.type || "").toLowerCase();
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/gif") return ".gif";
  if (mime === "image/webp") return ".webp";
  return fromName;
}

export function validateFigureFile(file: File): string | null {
  const ext = figureExtension(file);
  if (!FIGURE_EXTENSIONS.has(ext)) {
    return "Use JPG, PNG, GIF, or WEBP images only.";
  }
  if (file.size > FIGURE_MAX_BYTES) {
    return "Each image must be 10 MB or smaller.";
  }
  return null;
}

export type EnsurePublicationIdResult =
  | { ok: true; id: number }
  | { ok: false; error: string };
