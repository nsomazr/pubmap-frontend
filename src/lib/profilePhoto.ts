import api from "./api";
import { mediaUrl } from "./mediaUrl";
import type { User } from "../types";

export const PROFILE_CROP_VIEWPORT = 280;
export const PROFILE_OUTPUT_SIZE = 512;

export interface CropState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface LoadedImage {
  image: HTMLImageElement;
  objectUrl: string;
}

export function defaultCropState(): CropState {
  return { scale: 1, offsetX: 0, offsetY: 0 };
}

export function loadImageFromFile(file: File): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ image: img, objectUrl });
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not load image."));
    };
    img.src = objectUrl;
  });
}

export function revokeLoadedImage(loaded: LoadedImage | null | undefined): void {
  if (loaded?.objectUrl) URL.revokeObjectURL(loaded.objectUrl);
}

function baseCoverScale(image: HTMLImageElement, viewport: number): number {
  return Math.max(viewport / image.naturalWidth, viewport / image.naturalHeight);
}

export function cropImageToBlob(
  image: HTMLImageElement,
  crop: CropState,
  viewport = PROFILE_CROP_VIEWPORT,
  outputSize = PROFILE_OUTPUT_SIZE
): Promise<Blob> {
  const cover = baseCoverScale(image, viewport);
  const totalScale = cover * crop.scale;
  const iw = image.naturalWidth;
  const ih = image.naturalHeight;

  const imgLeft = viewport / 2 - (iw * totalScale) / 2 + crop.offsetX;
  const imgTop = viewport / 2 - (ih * totalScale) / 2 + crop.offsetY;

  let srcX = -imgLeft / totalScale;
  let srcY = -imgTop / totalScale;
  let srcW = viewport / totalScale;
  let srcH = viewport / totalScale;

  srcX = Math.max(0, srcX);
  srcY = Math.max(0, srcY);
  if (srcX + srcW > iw) srcW = iw - srcX;
  if (srcY + srcH > ih) srcH = ih - srcY;

  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("Canvas unavailable."));

  ctx.fillStyle = "#f1f5f9";
  ctx.fillRect(0, 0, outputSize, outputSize);
  ctx.drawImage(image, srcX, srcY, srcW, srcH, 0, 0, outputSize, outputSize);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not process image."));
      },
      "image/jpeg",
      0.92
    );
  });
}

export async function uploadProfilePhoto(blob: Blob): Promise<User> {
  const form = new FormData();
  form.append("photo", blob, "profile.jpg");
  try {
    const { data } = await api.post<User>("/auth/me/photo/", form);
    return data;
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { detail?: string } } };
    const detail = axiosErr.response?.data?.detail;
    throw new Error(detail || "Could not save profile photo. Try again.");
  }
}

export async function removeProfilePhoto(): Promise<User> {
  try {
    const { data } = await api.delete<User>("/auth/me/photo/");
    return data;
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { detail?: string } } };
    const detail = axiosErr.response?.data?.detail;
    throw new Error(detail || "Could not remove profile photo.");
  }
}

export const DEFAULT_PROFILE_PHOTO_URL =
  "https://thinksport.com.au/wp-content/uploads/2020/01/avatar-.jpg";

export function isDefaultProfilePhoto(photo?: string | null): boolean {
  if (!photo?.trim()) return true;
  const value = photo.trim().toLowerCase();
  if (value.includes("uploads/profiles/")) return false;
  return value.includes("avatar-.jpg") || value.endsWith("/avatar.jpg");
}

/** Returns null when the user has no custom upload (show initials instead). */
export function effectiveProfilePhoto(photo?: string | null): string | null {
  if (isDefaultProfilePhoto(photo)) return null;
  return photo!.trim();
}

/** Resolve a profile photo for display, with optional cache-busting version token. */
export function resolveProfilePhotoSrc(
  photo?: string | null,
  cacheVersion?: string | null
): string | null {
  const raw = effectiveProfilePhoto(photo);
  if (!raw) return null;

  let url: string | null;
  if (raw.startsWith("blob:") || raw.startsWith("http://") || raw.startsWith("https://")) {
    url = raw;
  } else {
    // Route stored paths through mediaUrl so production SPA hosts resolve API media correctly.
    url = mediaUrl(raw);
  }

  if (!url) return url;
  const version = cacheVersion || (raw.startsWith("blob:") ? null : raw);
  if (!version) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${encodeURIComponent(version)}`;
}
