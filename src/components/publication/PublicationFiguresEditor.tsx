import { ImagePlus, Trash2, X, ZoomIn } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  deleteFigure,
  updateFigure,
  uploadFigure,
  type PublicationFigure,
} from "../../lib/publicationGre";
import { mediaUrl } from "../../lib/mediaUrl";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

interface Props {
  publicationId: number;
  encodedPublicationId?: string | null;
  figures: PublicationFigure[];
  onChange: (figures: PublicationFigure[]) => void;
  readOnly?: boolean;
  variant?: "composer" | "public";
  /** Creates a draft on the server when the user uploads before the first manual save. */
  ensurePublicationId?: () => Promise<number | null>;
  /** Notifies parent while uploads run (blocks submit while true). */
  onUploadingChange?: (uploading: boolean) => void;
  /** True when one or more chosen images failed to upload (retry before submit). */
  onFailedPendingChange?: (hasFailed: boolean) => void;
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
    : "rounded-2xl border border-slate-200 bg-white p-5 ring-1 ring-slate-200/80 sm:p-6";
}

function defaultCaptionFromFile(file: File, figureIndex: number): string {
  const base = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
  return base || `Figure ${figureIndex}`;
}

export function PublicationFiguresEditor({
  publicationId,
  encodedPublicationId,
  figures,
  onChange,
  readOnly,
  variant = "composer",
  ensurePublicationId,
  onUploadingChange,
  onFailedPendingChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [preview, setPreview] = useState<PublicationFigure | null>(null);
  const [failed, setFailed] = useState<PendingUpload[]>([]);
  const failedRef = useRef(failed);
  failedRef.current = failed;
  const [captions, setCaptions] = useState<Record<number, string>>({});
  const [savingCaptionId, setSavingCaptionId] = useState<number | null>(null);

  useEffect(() => {
    onUploadingChange?.(uploading);
  }, [uploading, onUploadingChange]);

  useEffect(() => {
    onFailedPendingChange?.(failed.length > 0);
  }, [failed.length, onFailedPendingChange]);

  useEffect(() => {
    setCaptions(
      Object.fromEntries(figures.map((fig) => [fig.id, fig.caption?.trim() || ""]))
    );
  }, [figures]);

  useEffect(
    () => () => {
      failedRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    },
    []
  );

  const resolvePublicationId = async (): Promise<number | null> => {
    if (publicationId > 0) return publicationId;
    if (!ensurePublicationId) return null;
    return ensurePublicationId();
  };

  const uploadItems = async (items: PendingUpload[]) => {
    if (!items.length || readOnly) return;
    setUploadError("");
    const pubId = await resolvePublicationId();
    if (!pubId) {
      setUploadError("Add a title and abstract before uploading figures.");
      setFailed((prev) => [...prev, ...items]);
      return;
    }
    setUploading(true);
    const uploaded: PublicationFigure[] = [];
    const stillFailed: PendingUpload[] = [];
    try {
      let nextFigures = figures;
      let index = figures.length;
      for (const item of items) {
        const caption = item.caption.trim() || defaultCaptionFromFile(item.file, index + 1);
        try {
          const fig = (await uploadFigure(
            pubId,
            item.file,
            { caption },
            encodedPublicationId
          )) as PublicationFigure;
          uploaded.push(fig);
          nextFigures = [...nextFigures, fig];
          URL.revokeObjectURL(item.previewUrl);
          index += 1;
        } catch (err: unknown) {
          const e = err as { response?: { data?: { detail?: string } } };
          setUploadError(
            e.response?.data?.detail ||
              "Figure upload failed. Use JPG, PNG, GIF, WEBP, or SVG under 10 MB."
          );
          stillFailed.push({ ...item, caption });
        }
      }
      if (uploaded.length) {
        onChange(nextFigures);
      }
      if (stillFailed.length) {
        setFailed((prev) => [...prev, ...stillFailed]);
      }
    } finally {
      setUploading(false);
    }
  };

  const queueFiles = (files: FileList | null) => {
    if (!files?.length || readOnly || uploading) return;
    const items = Array.from(files).map((file) => ({
      key: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
      file,
      caption: "",
      previewUrl: URL.createObjectURL(file),
    }));
    setUploadError("");
    if (inputRef.current) inputRef.current.value = "";
    void uploadItems(items);
  };

  const retryFailed = () => {
    if (!failed.length) return;
    const batch = [...failed];
    setFailed([]);
    void uploadItems(batch);
  };

  const removeFailed = (key: string) => {
    setFailed((prev) => {
      const item = prev.find((p) => p.key === key);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((p) => p.key !== key);
    });
  };

  const remove = async (id: number) => {
    const pubId = await resolvePublicationId();
    if (!pubId) return;
    await deleteFigure(pubId, id, encodedPublicationId);
    onChange(figures.filter((f) => f.id !== id));
  };

  const saveCaption = async (fig: PublicationFigure) => {
    const nextCaption = (captions[fig.id] ?? "").trim();
    if (nextCaption === (fig.caption?.trim() || "")) return;
    setSavingCaptionId(fig.id);
    try {
      const pubId = await resolvePublicationId();
      if (!pubId) return;
      const updated = await updateFigure(
        pubId,
        fig.id,
        { caption: nextCaption },
        encodedPublicationId
      );
      onChange(figures.map((item) => (item.id === fig.id ? updated : item)));
    } finally {
      setSavingCaptionId(null);
    }
  };

  return (
    <section className={shellClass(variant)}>
      <h3 className="text-sm font-bold uppercase tracking-wider text-brand-600">Research figures</h3>

      {!readOnly && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
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
            {uploading ? "Uploading…" : "Choose images"}
          </Button>
          {failed.length > 0 && (
            <Button type="button" loading={uploading} onClick={retryFailed}>
              Retry {failed.length} failed
            </Button>
          )}
        </div>
      )}

      {!readOnly && uploading && (
        <p className="mt-2 text-sm text-brand-700">Uploading figures…</p>
      )}

      {!readOnly && failed.length > 0 && (
        <ul className="mt-4 space-y-3">
          {failed.map((item, index) => (
            <li
              key={item.key}
              className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50/50 p-3 sm:flex-row sm:items-start"
            >
              <img
                src={item.previewUrl}
                alt=""
                className="h-28 w-full shrink-0 rounded-lg border border-slate-200 bg-white object-contain sm:h-24 sm:w-36"
              />
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-xs font-semibold text-red-800">
                  Upload failed · {item.file.name}
                </p>
                <Input
                  label="Caption"
                  value={item.caption}
                  onChange={(e) =>
                    setFailed((prev) =>
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
                onClick={() => removeFailed(item.key)}
                className="self-start rounded-lg p-2 text-slate-400 hover:bg-white hover:text-red-600"
                aria-label="Remove failed figure"
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
            const src = mediaUrl(fig.photo);
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
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-600">
                    {figureLabel(fig, index)}
                  </p>
                  {!readOnly ? (
                    <Input
                      label="Caption"
                      value={captions[fig.id] ?? ""}
                      onChange={(e) =>
                        setCaptions((prev) => ({ ...prev, [fig.id]: e.target.value }))
                      }
                      onBlur={() => saveCaption(fig)}
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
                    <button
                      type="button"
                      onClick={() => remove(fig.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                    >
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  )}
                </figcaption>
              </figure>
            );
          })}
        </div>
      ) : (
        !readOnly &&
        !uploading &&
        !failed.length && (
          <p className="mt-4 text-sm text-slate-500">No figures uploaded yet.</p>
        )
      )}

      {preview && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/85 p-4 backdrop-blur-sm"
          onClick={() => setPreview(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Figure preview"
        >
          <div className="max-h-full max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              onClick={() => setPreview(null)}
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={mediaUrl(preview.photo) || ""}
              alt={preview.caption || "Figure preview"}
              loading="eager"
              className="mx-auto max-h-[min(82vh,900px)] w-auto max-w-full rounded-lg object-contain shadow-2xl"
            />
            <div className="mt-3 text-center text-sm text-white/95">
              <p className="font-semibold">
                {figureLabel(
                  preview,
                  Math.max(0, figures.findIndex((f) => f.id === preview.id))
                )}
              </p>
              {(preview.caption || "").trim() && (
                <p className="mt-1 max-w-2xl mx-auto leading-relaxed">{preview.caption}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export function PublicationFiguresGallery({
  figures,
  variant = "public",
}: {
  figures: PublicationFigure[];
  variant?: "composer" | "public";
}) {
  if (!figures.length) return null;
  return (
    <PublicationFiguresEditor
      publicationId={0}
      figures={figures}
      onChange={() => {}}
      readOnly
      variant={variant}
    />
  );
}
