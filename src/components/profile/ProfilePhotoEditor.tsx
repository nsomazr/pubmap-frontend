import { useMutation } from "@tanstack/react-query";
import { Camera, CheckCircle2, Loader2, Trash2, Upload, X, ZoomIn } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  PROFILE_CROP_VIEWPORT,
  cropImageToBlob,
  defaultCropState,
  isDefaultProfilePhoto,
  loadImageFromFile,
  removeProfilePhoto,
  revokeLoadedImage,
  uploadProfilePhoto,
  type CropState,
  type LoadedImage,
} from "../../lib/profilePhoto";
import { userInitials } from "../../lib/userDisplay";
import { useAuth } from "../../context/AuthContext";
import type { User } from "../../types";
import { GreAvatarSlot } from "../ui/GreHeroBanner";
import { Button } from "../ui/Button";

interface Props {
  user: User;
  onUpdated: () => void | Promise<void>;
}

function parseUploadError(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export function ProfilePhotoEditor({ user, onUpdated }: Props) {
  const { patchUser } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const loadedRef = useRef<LoadedImage | null>(null);
  const [open, setOpen] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const [loaded, setLoaded] = useState<LoadedImage | null>(null);
  const [crop, setCrop] = useState<CropState>(defaultCropState);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [displayPhoto, setDisplayPhoto] = useState(user.photo);
  const [displayVersion, setDisplayVersion] = useState(user.updated_at);

  const initials = userInitials(user);

  useEffect(() => {
    setDisplayPhoto(user.photo);
    setDisplayVersion(user.updated_at);
  }, [user.photo, user.updated_at]);

  const closeEditor = useCallback(() => {
    setOpen(false);
    setLoadingImage(false);
    setCrop(defaultCropState());
    setError("");
    setPendingPreview(null);
    revokeLoadedImage(loadedRef.current);
    loadedRef.current = null;
    setLoaded(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  useEffect(() => () => revokeLoadedImage(loadedRef.current), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeEditor();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeEditor]);

  const applySavedUser = useCallback(
    async (updatedUser: User) => {
      patchUser(updatedUser);
      setDisplayPhoto(updatedUser.photo);
      setDisplayVersion(updatedUser.updated_at || String(Date.now()));
      await onUpdated();
    },
    [onUpdated, patchUser]
  );

  const uploadMutation = useMutation({
    mutationFn: async (blob: Blob) => uploadProfilePhoto(blob),
    onSuccess: async (updatedUser) => {
      setPendingPreview(null);
      await applySavedUser(updatedUser);
      setSuccess("Profile photo saved.");
      setError("");
      closeEditor();
    },
    onError: (err) => setError(parseUploadError(err, "Could not save profile photo. Try again.")),
  });

  const removeMutation = useMutation({
    mutationFn: () => removeProfilePhoto(),
    onSuccess: async (updatedUser) => {
      await applySavedUser(updatedUser);
      setSuccess("Profile photo removed.");
      setError("");
      closeEditor();
    },
    onError: (err) => setError(parseUploadError(err, "Could not remove profile photo.")),
  });

  const openFilePicker = () => {
    setSuccess("");
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.click();
    }
  };

  const onPickFile = async (file: File | null) => {
    if (!file) return;

    const type = file.type.toLowerCase();
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const allowedExt = ["jpg", "jpeg", "png", "webp", "gif"];
    if (!type.startsWith("image/") && !allowedExt.includes(ext)) {
      setError("Choose a JPG, PNG, WEBP, or GIF image.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Image must be 8 MB or smaller.");
      return;
    }

    setError("");
    setSuccess("");
    setOpen(true);
    setLoadingImage(true);
    setPendingPreview(null);
    revokeLoadedImage(loadedRef.current);
    loadedRef.current = null;
    setLoaded(null);
    setCrop(defaultCropState());

    try {
      const next = await loadImageFromFile(file);
      loadedRef.current = next;
      setLoaded(next);
      setPendingPreview(next.objectUrl);
    } catch {
      setError("Could not open that image. Try JPG or PNG.");
      setOpen(false);
    } finally {
      setLoadingImage(false);
    }
  };

  const savePhoto = async () => {
    if (!loaded?.image) return;
    setError("");
    setSuccess("");
    try {
      const blob = await cropImageToBlob(loaded.image, crop);
      uploadMutation.mutate(blob);
    } catch {
      setError("Could not prepare your photo. Try again.");
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!loaded || loadingImage) return;
    dragRef.current = { x: e.clientX, y: e.clientY, ox: crop.offsetX, oy: crop.offsetY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    setCrop((c) => ({
      ...c,
      offsetX: drag.ox + (e.clientX - drag.x),
      offsetY: drag.oy + (e.clientY - drag.y),
    }));
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    if (!loaded) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setCrop((c) => ({
      ...c,
      scale: Math.min(3, Math.max(1, Number((c.scale + delta).toFixed(2)))),
    }));
  };

  const image = loaded?.image ?? null;
  const coverScale =
    image && image.naturalWidth
      ? Math.max(
          PROFILE_CROP_VIEWPORT / image.naturalWidth,
          PROFILE_CROP_VIEWPORT / image.naturalHeight
        )
      : 1;
  const totalScale = coverScale * crop.scale;
  const displayW = image ? image.naturalWidth * totalScale : 0;
  const displayH = image ? image.naturalHeight * totalScale : 0;
  const busy = loadingImage || uploadMutation.isPending || removeMutation.isPending;
  const avatarPhoto = pendingPreview || displayPhoto;
  const avatarVersion = pendingPreview ? "pending" : displayVersion;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={openFilePicker}
          className="group relative shrink-0 self-start rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          aria-label="Upload profile photo"
        >
          <GreAvatarSlot
            photoUrl={avatarPhoto}
            photoVersion={avatarVersion}
            initials={initials}
            size="lg"
          />
          {uploadMutation.isPending && (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70">
              <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
            </span>
          )}
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-900/0 transition group-hover:bg-slate-900/35">
            <Camera className="h-6 w-6 text-white opacity-0 transition group-hover:opacity-100" />
          </span>
          <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white shadow-md ring-2 ring-white">
            <Camera className="h-4 w-4" />
          </span>
        </button>

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-ink">Profile photo</h3>
            <p className="mt-1 text-sm text-slate-600">
              Shown on publications, discussions, the research map, and collaborator lists. Saves
              immediately when you click <span className="font-medium text-ink">Save photo</span> in
              the crop dialog, not via Update profile.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
              className="hidden"
              onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
            />
            <Button type="button" variant="secondary" onClick={openFilePicker}>
              <Upload className="h-4 w-4" />
              {isDefaultProfilePhoto(displayPhoto) ? "Upload photo" : "Change photo"}
            </Button>
            {!isDefaultProfilePhoto(displayPhoto) && (
              <Button
                type="button"
                variant="secondary"
                loading={removeMutation.isPending}
                onClick={() => removeMutation.mutate()}
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </Button>
            )}
          </div>

          {success && !open && (
            <p className="flex items-center gap-2 text-sm text-teal-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {success}
            </p>
          )}
          {error && !open && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[3000] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-photo-dialog-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !busy) closeEditor();
          }}
        >
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 id="profile-photo-dialog-title" className="font-semibold text-ink">
                  Adjust profile photo
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                  Drag to reposition. Scroll or use the slider to zoom, then save.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                disabled={busy}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-ink disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 flex justify-center">
              {loadingImage ? (
                <div
                  className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-slate-100 text-slate-500"
                  style={{ width: PROFILE_CROP_VIEWPORT, height: PROFILE_CROP_VIEWPORT }}
                >
                  <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
                  <span className="text-sm">Loading image…</span>
                </div>
              ) : loaded?.objectUrl && image ? (
                <div
                  className="relative cursor-grab overflow-hidden rounded-2xl bg-slate-900 active:cursor-grabbing"
                  style={{ width: PROFILE_CROP_VIEWPORT, height: PROFILE_CROP_VIEWPORT }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  onWheel={onWheel}
                >
                  <img
                    src={loaded.objectUrl}
                    alt=""
                    draggable={false}
                    className="pointer-events-none absolute max-w-none select-none"
                    style={{
                      width: displayW,
                      height: displayH,
                      left: PROFILE_CROP_VIEWPORT / 2 - displayW / 2 + crop.offsetX,
                      top: PROFILE_CROP_VIEWPORT / 2 - displayH / 2 + crop.offsetY,
                    }}
                  />
                  <div
                    className="pointer-events-none absolute inset-0 rounded-2xl"
                    style={{
                      boxShadow: "inset 0 0 0 9999px rgba(15, 23, 42, 0.35)",
                      clipPath: "circle(42% at 50% 50%)",
                    }}
                  />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div
                      className="rounded-full ring-2 ring-white/90"
                      style={{
                        width: PROFILE_CROP_VIEWPORT * 0.84,
                        height: PROFILE_CROP_VIEWPORT * 0.84,
                      }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No image loaded. Choose a photo to continue.</p>
              )}
            </div>

            {!loadingImage && loaded && (
              <>
                <label className="mt-4 flex items-center gap-3 text-sm text-slate-600">
                  <ZoomIn className="h-4 w-4 shrink-0 text-brand-600" />
                  <span className="shrink-0 font-medium">Zoom</span>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.02}
                    value={crop.scale}
                    onChange={(e) =>
                      setCrop((c) => ({ ...c, scale: Number(e.target.value) }))
                    }
                    className="w-full accent-brand-600"
                  />
                </label>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    loading={uploadMutation.isPending}
                    onClick={() => void savePhoto()}
                  >
                    Save photo
                  </Button>
                  <Button type="button" variant="secondary" onClick={closeEditor} disabled={busy}>
                    Cancel
                  </Button>
                </div>
              </>
            )}

            {error && open && <p className="mt-3 text-sm text-red-600">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
