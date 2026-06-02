import { ImagePlus, Loader2, RefreshCw, Trash2, X, ZoomIn } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFigurePreviewUrls } from "../../hooks/useFigurePreviewUrls";
import {
  deleteFigure,
  updateFigure,
  uploadFigure,
  type PublicationFigure,
} from "../../lib/publicationGre";
import { greFormSectionTitleClass } from "../../lib/formStyles";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { FigureLightbox } from "./FigureLightbox";
import { PublicationFiguresDisplay } from "./PublicationFiguresDisplay";

interface Props {
  publicationId: number;
  encodedPublicationId?: string | null;
  figures: PublicationFigure[];
  onChange: (figures: PublicationFigure[]) => void;
  readOnly?: boolean;
  variant?: "composer" | "public";
  /** Creates a draft on the server when the user uploads before the first manual save. */
  ensurePublicationId?: () => Promise<number | null>;
  onActivityChange?: (state: { uploading: boolean; pendingCount: number }) => void;
  /** Parent calls this before save/submit to persist any debounced caption edits. */
  registerFlushCaptions?: (flush: (() => Promise<void>) | null) => void;
}

type PendingUpload = {
  key: string;
  file: File;
  caption: string;
  previewUrl: string;
};

function figureLabel(fig: PublicationFigure, index: number): string {
  return fig.figure_number?.trim() || `Figure ${index + 1}`;
}

function shellClass(variant: "composer" | "public") {
  return variant === "public"
    ? "gre-public-card min-w-0 overflow-hidden p-6 sm:p-8"
    : "gre-form-section !mb-0 space-y-4";
}

export function PublicationFiguresEditor({
  publicationId,
  encodedPublicationId,
  figures,
  onChange,
  readOnly,
  variant = "composer",
  ensurePublicationId,
  onActivityChange,
  registerFlushCaptions,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [preview, setPreview] = useState<PublicationFigure | null>(null);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const pendingRef = useRef(pending);
  pendingRef.current = pending;
  const [captions, setCaptions] = useState<Record<number, string>>({});
  const [savingCaptionId, setSavingCaptionId] = useState<number | null>(null);
  const [replacingFigureId, setReplacingFigureId] = useState<number | null>(null);
  const captionsRef = useRef<Record<number, string>>({});
  const persistedCaptionsRef = useRef<Record<number, string>>({});
  const captionSaveTimersRef = useRef<Record<number, number>>({});
  const figuresRef = useRef(figures);
  figuresRef.current = figures;
  const figurePreviewUrls = useFigurePreviewUrls(
    figures,
    publicationId,
    encodedPublicationId
  );
  const [localPreviews, setLocalPreviews] = useState<Record<number, string>>({});
  const replaceInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  useEffect(() => {
    setLocalPreviews((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const [id, url] of Object.entries(prev)) {
        const figureId = Number(id);
        if (figurePreviewUrls[figureId]) {
          URL.revokeObjectURL(url);
          delete next[figureId];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [figurePreviewUrls]);

  useEffect(() => {
    setCaptions((prev) => {
      const next: Record<number, string> = { ...prev };
      const figureIds = new Set(figures.map((fig) => fig.id));

      for (const fig of figures) {
        const serverCaption = fig.caption?.trim() || "";
        const persisted = persistedCaptionsRef.current[fig.id];
        if (persisted === undefined) {
          next[fig.id] = serverCaption;
          persistedCaptionsRef.current[fig.id] = serverCaption;
        } else if (serverCaption === persisted) {
          next[fig.id] = serverCaption;
        }
      }

      for (const id of Object.keys(next)) {
        const figureId = Number(id);
        if (!figureIds.has(figureId)) {
          delete next[figureId];
          delete persistedCaptionsRef.current[figureId];
        }
      }

      return next;
    });
  }, [figures]);

  useEffect(() => {
    captionsRef.current = captions;
  }, [captions]);

  useEffect(
    () => () => {
      pendingRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      Object.values(localPreviews).forEach((url) => URL.revokeObjectURL(url));
      Object.values(captionSaveTimersRef.current).forEach((timer) => {
        window.clearTimeout(timer);
      });
    },
    [localPreviews]
  );

  useEffect(() => {
    onActivityChange?.({ uploading, pendingCount: pending.length });
  }, [uploading, pending.length, onActivityChange]);

  const queueFiles = (files: FileList | null) => {
    if (!files?.length || readOnly || uploading) return;
    const next = Array.from(files).map((file) => ({
      key: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
      file,
      caption: "",
      previewUrl: URL.createObjectURL(file),
    }));
    setPending((prev) => [...prev, ...next]);
    setUploadError("");
    if (inputRef.current) inputRef.current.value = "";
    void uploadItems(next);
  };

  const removePending = (key: string) => {
    setPending((prev) => {
      const item = prev.find((p) => p.key === key);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((p) => p.key !== key);
    });
  };

  const resolvePublicationId = async (): Promise<number | null> => {
    if (publicationId > 0) return publicationId;
    if (!ensurePublicationId) return null;
    return ensurePublicationId();
  };

  const uploadItems = async (items: PendingUpload[]) => {
    if (!items.length || readOnly) return;
    setUploading(true);
    setUploadError("");
    const uploaded: PublicationFigure[] = [];
    const uploadedKeys = new Set<string>();
    let baseIndex = figures.length;
    try {
      const pubId = await resolvePublicationId();
      if (!pubId) {
        setUploadError("Add a title and abstract before adding figures.");
        return;
      }
      for (const item of items) {
        const caption =
          item.caption.trim() || `Figure ${baseIndex + uploaded.length + 1}`;
        const fig = (await uploadFigure(
          pubId,
          item.file,
          { caption },
          encodedPublicationId
        )) as PublicationFigure;
        uploaded.push(fig);
        uploadedKeys.add(item.key);
        setLocalPreviews((prev) => ({ ...prev, [fig.id]: item.previewUrl }));
      }
      if (uploaded.length) {
        onChange([...figures, ...uploaded]);
        setPending((prev) => prev.filter((p) => !uploadedKeys.has(p.key)));
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setUploadError(
        e.response?.data?.detail ||
          "Figure upload failed. Use JPG, PNG, GIF, or WEBP under 10 MB."
      );
      if (uploaded.length) {
        onChange([...figures, ...uploaded]);
        setPending((prev) => prev.filter((p) => !uploadedKeys.has(p.key)));
      }
    } finally {
      setUploading(false);
    }
  };

  const retryPending = () => {
    if (pending.length) void uploadItems([...pending]);
  };

  const remove = async (id: number) => {
    const pubId = await resolvePublicationId();
    if (!pubId) return;
    await deleteFigure(pubId, id, encodedPublicationId);
    onChange(figures.filter((f) => f.id !== id));
  };

  const replaceFigureImage = async (figureId: number, file: File) => {
    if (readOnly) return;
    setUploadError("");
    setReplacingFigureId(figureId);
    try {
      const pubId = await resolvePublicationId();
      if (!pubId) {
        setUploadError("Save publication details first, then try replacing the figure.");
        return;
      }
      const currentCaption = (captionsRef.current[figureId] ?? "").trim();
      const updated = await updateFigure(
        pubId,
        figureId,
        { caption: currentCaption },
        encodedPublicationId,
        file
      );
      const nextLocalUrl = URL.createObjectURL(file);
      setLocalPreviews((prev) => {
        const old = prev[figureId];
        if (old) URL.revokeObjectURL(old);
        return { ...prev, [figureId]: nextLocalUrl };
      });
      onChange(
        figuresRef.current.map((item) => (item.id === figureId ? updated : item))
      );
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setUploadError(
        e.response?.data?.detail ||
          "Could not replace figure image. Use JPG, PNG, GIF, or WEBP under 10 MB."
      );
    } finally {
      setReplacingFigureId(null);
    }
  };

  const saveCaptionById = useCallback(
    async (figureId: number) => {
      const fig = figuresRef.current.find((item) => item.id === figureId);
      if (!fig) return true;
      const nextCaption = (captionsRef.current[figureId] ?? "").trim();
      const persisted = (persistedCaptionsRef.current[figureId] ?? "").trim();
      if (nextCaption === persisted) return true;
      setSavingCaptionId(figureId);
      try {
        const pubId = await resolvePublicationId();
        if (!pubId) return false;
        const updated = await updateFigure(
          pubId,
          figureId,
          { caption: nextCaption },
          encodedPublicationId
        );
        persistedCaptionsRef.current[figureId] = nextCaption;
        const current = figuresRef.current;
        onChange(current.map((item) => (item.id === figureId ? updated : item)));
        return true;
      } catch {
        return false;
      } finally {
        setSavingCaptionId(null);
      }
    },
    [encodedPublicationId, onChange, publicationId]
  );

  const flushPendingCaptionSaves = useCallback(async () => {
    for (const timer of Object.values(captionSaveTimersRef.current)) {
      window.clearTimeout(timer);
    }
    captionSaveTimersRef.current = {};
    const dirtyIds = figuresRef.current
      .map((fig) => fig.id)
      .filter((figureId) => {
        const next = (captionsRef.current[figureId] ?? "").trim();
        const persisted = (persistedCaptionsRef.current[figureId] ?? "").trim();
        return next !== persisted;
      });
    if (!dirtyIds.length) return;
    const results = await Promise.all(dirtyIds.map((figureId) => saveCaptionById(figureId)));
    if (results.some((ok) => !ok)) {
      throw new Error("CAPTION_SAVE_FAILED");
    }
  }, [saveCaptionById]);

  useEffect(() => {
    registerFlushCaptions?.(flushPendingCaptionSaves);
    return () => registerFlushCaptions?.(null);
  }, [registerFlushCaptions, flushPendingCaptionSaves]);

  const scheduleCaptionSave = (figureId: number) => {
    const prevTimer = captionSaveTimersRef.current[figureId];
    if (prevTimer) {
      window.clearTimeout(prevTimer);
    }
    captionSaveTimersRef.current[figureId] = window.setTimeout(() => {
      delete captionSaveTimersRef.current[figureId];
      void saveCaptionById(figureId);
    }, 600);
  };

  return (
    <section className={shellClass(variant)}>
      <h3
        className={
          variant === "public"
            ? "text-sm font-bold uppercase tracking-wider text-brand-600"
            : greFormSectionTitleClass
        }
      >
        Research figures
      </h3>

      {!readOnly && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => queueFiles(e.target.files)}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus className="h-4 w-4" />
            Choose images
          </Button>
          {uploading && (
            <span className="inline-flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin text-brand-600" aria-hidden />
              Uploading figures…
            </span>
          )}
          {pending.length > 0 && !uploading && (
            <Button type="button" variant="secondary" onClick={retryPending}>
              Retry upload ({pending.length})
            </Button>
          )}
        </div>
      )}

      {!readOnly && pending.length > 0 && (
        <ul className="mt-4 space-y-3">
          {pending.map((item, index) => (
            <li
              key={item.key}
              className="flex flex-col gap-3 rounded-xl border border-brand-100 bg-brand-50/30 p-3 sm:flex-row sm:items-start"
            >
              <img
                src={item.previewUrl}
                alt=""
                className="h-28 w-full shrink-0 rounded-lg border border-slate-200 bg-white object-contain sm:h-24 sm:w-36"
              />
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-xs font-semibold text-slate-600">
                  {uploading ? "Uploading" : "Waiting to upload"} · {item.file.name}
                </p>
                <Input
                  label="Caption"
                  value={item.caption}
                  onChange={(e) =>
                    setPending((prev) =>
                      prev.map((p) =>
                        p.key === item.key ? { ...p, caption: e.target.value } : p
                      )
                    )
                  }
                  placeholder="Describe what this figure shows"
                />
              </div>
              <button
                type="button"
                onClick={() => removePending(item.key)}
                className="self-start rounded-lg p-2 text-slate-400 hover:bg-white hover:text-red-600"
                aria-label="Remove pending figure"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}

      {figures.length > 0 ? (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {figures.map((fig, index) => {
            const src = figurePreviewUrls[fig.id] || localPreviews[fig.id];
            const previewLoading =
              Boolean(publicationId && fig.id > 0) &&
              src === undefined &&
              !localPreviews[fig.id];
            const captionText = (readOnly ? fig.caption : captions[fig.id])?.trim() || "";
            return (
              <figure
                key={fig.id}
                className="flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50/50 shadow-sm"
              >
                <button
                  type="button"
                  className="group relative block w-full bg-white"
                  onClick={() => setPreview(fig)}
                >
                  {src ? (
                    <img
                      src={src}
                      alt={captionText || figureLabel(fig, index)}
                      loading="lazy"
                      decoding="async"
                      className="max-h-64 min-h-[12rem] w-full object-contain p-3 transition group-hover:opacity-95"
                    />
                  ) : previewLoading ? (
                    <div className="flex min-h-[12rem] items-center justify-center gap-2 bg-slate-100 text-slate-500">
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                      <span className="text-sm">Loading preview…</span>
                    </div>
                  ) : (
                    <div className="flex min-h-[12rem] items-center justify-center bg-slate-100 text-slate-400">
                      No preview
                    </div>
                  )}
                  <span className="absolute right-2 top-2 rounded-full bg-white/95 p-1.5 shadow ring-1 ring-slate-200/80">
                    <ZoomIn className="h-4 w-4 text-brand-600" />
                  </span>
                </button>
                <figcaption className="space-y-2 border-t border-slate-100 bg-white p-3 text-sm">
                  {!readOnly && (
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={(node) => {
                        replaceInputRefs.current[fig.id] = node;
                      }}
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        if (file) void replaceFigureImage(fig.id, file);
                        e.target.value = "";
                      }}
                    />
                  )}
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-600">
                    {figureLabel(fig, index)}
                  </p>
                  {!readOnly ? (
                    <Input
                      label="Caption"
                      value={captions[fig.id] ?? ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCaptions((prev) => ({ ...prev, [fig.id]: value }));
                        onChange(
                          figures.map((item) =>
                            item.id === fig.id ? { ...item, caption: value } : item
                          )
                        );
                        scheduleCaptionSave(fig.id);
                      }}
                      onBlur={() => void saveCaptionById(fig.id)}
                      placeholder="Describe what this figure shows"
                    />
                  ) : (
                    <p
                      className={`leading-relaxed ${captionText ? "text-slate-700" : "italic text-slate-400"}`}
                    >
                      {captionText || "No caption provided."}
                    </p>
                  )}
                  {!readOnly && savingCaptionId === fig.id && (
                    <p className="text-xs text-slate-500">Saving caption…</p>
                  )}
                  {!readOnly && (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => replaceInputRefs.current[fig.id]?.click()}
                        disabled={replacingFigureId === fig.id}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline disabled:opacity-60"
                      >
                        {replacingFigureId === fig.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                        {replacingFigureId === fig.id ? "Replacing..." : "Replace image"}
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(fig.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                      >
                        <Trash2 className="h-3 w-3" /> Remove
                      </button>
                    </div>
                  )}
                </figcaption>
              </figure>
            );
          })}
        </div>
      ) : (
        !readOnly &&
        !pending.length && (
          <p className="mt-4 text-sm text-slate-500">No figures uploaded yet.</p>
        )
      )}

      <FigureLightbox
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        src={preview ? figurePreviewUrls[preview.id] || "" : ""}
        alt={preview?.caption || "Figure preview"}
      >
        {preview ? (
          <>
            <p className="font-semibold">
              {figureLabel(
                preview,
                Math.max(0, figures.findIndex((f) => f.id === preview.id))
              )}
            </p>
            {(preview.caption || "").trim() && (
              <p className="mt-1 mx-auto max-w-2xl leading-relaxed">{preview.caption}</p>
            )}
          </>
        ) : null}
      </FigureLightbox>
    </section>
  );
}

export function PublicationFiguresGallery({
  figures,
  publicationId = 0,
  encodedPublicationId,
  variant = "public",
}: {
  figures: PublicationFigure[];
  publicationId?: number | string;
  encodedPublicationId?: string | null;
  variant?: "composer" | "public";
}) {
  return (
    <PublicationFiguresDisplay
      figures={figures}
      publicationId={publicationId}
      encodedPublicationId={encodedPublicationId}
      variant={variant}
    />
  );
}
