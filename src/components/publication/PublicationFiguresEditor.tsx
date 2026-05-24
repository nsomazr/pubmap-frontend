import { ImagePlus, Trash2, ZoomIn } from "lucide-react";
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
  figures: PublicationFigure[];
  onChange: (figures: PublicationFigure[]) => void;
  readOnly?: boolean;
}

function figureLabel(fig: PublicationFigure, index: number): string {
  return fig.figure_number?.trim() || `Figure ${index + 1}`;
}

export function PublicationFiguresEditor({ publicationId, figures, onChange, readOnly }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [preview, setPreview] = useState<PublicationFigure | null>(null);
  const [draft, setDraft] = useState({ caption: "" });
  const [captions, setCaptions] = useState<Record<number, string>>({});
  const [savingCaptionId, setSavingCaptionId] = useState<number | null>(null);

  useEffect(() => {
    setCaptions(
      Object.fromEntries(
        figures.map((fig) => [fig.id, fig.caption?.trim() || ""])
      )
    );
  }, [figures]);

  const onFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file || readOnly) return;
    const caption = draft.caption.trim();
    if (!caption) {
      setUploadError("Enter a figure caption before uploading.");
      return;
    }
    setUploading(true);
    setUploadError("");
    try {
      const fig = (await uploadFigure(publicationId, file, { caption })) as PublicationFigure;
      onChange([...figures, fig]);
      setDraft({ caption: "" });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setUploadError(
        e.response?.data?.detail || "Figure upload failed. Use JPG, PNG, GIF, WEBP, or SVG under 10 MB."
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async (id: number) => {
    await deleteFigure(publicationId, id);
    onChange(figures.filter((f) => f.id !== id));
  };

  const saveCaption = async (fig: PublicationFigure) => {
    const nextCaption = (captions[fig.id] ?? "").trim();
    if (nextCaption === (fig.caption?.trim() || "")) return;
    setSavingCaptionId(fig.id);
    try {
      const updated = await updateFigure(publicationId, fig.id, { caption: nextCaption });
      onChange(figures.map((item) => (item.id === fig.id ? updated : item)));
    } finally {
      setSavingCaptionId(null);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 ring-1 ring-slate-200/80 sm:p-6">
      <h3 className="text-sm font-bold uppercase tracking-wider text-brand-600">Research figures</h3>

      {!readOnly && (
        <div className="mt-3">
          <Input
            label="Figure caption"
            value={draft.caption}
            onChange={(e) => setDraft((d) => ({ ...d, caption: e.target.value }))}
            placeholder="Describe what this figure shows"
          />
        </div>
      )}

      {!readOnly && (
        <div className="mt-4">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
          <Button
            type="button"
            variant="secondary"
            loading={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus className="h-4 w-4" />
            Add figure
          </Button>
          {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}
        </div>
      )}

      {figures.length > 0 ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {figures.map((fig, index) => {
            const src = mediaUrl(fig.photo);
            const captionText = (readOnly ? fig.caption : captions[fig.id])?.trim() || "";
            return (
              <figure key={fig.id} className="group overflow-hidden rounded-xl ring-1 ring-slate-200">
                <button type="button" className="relative block w-full" onClick={() => setPreview(fig)}>
                  {src ? (
                    <img
                      src={src}
                      alt={captionText || figureLabel(fig, index)}
                      className="aspect-[4/3] w-full object-cover transition group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center bg-slate-100 text-slate-400">
                      No preview
                    </div>
                  )}
                  <span className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 shadow">
                    <ZoomIn className="h-4 w-4 text-brand-600" />
                  </span>
                </button>
                <figcaption className="space-y-2 p-3 text-sm">
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-600">
                    {figureLabel(fig, index)}
                  </p>
                  {!readOnly ? (
                    <Input
                      label="Figure caption"
                      value={captions[fig.id] ?? ""}
                      onChange={(e) =>
                        setCaptions((prev) => ({ ...prev, [fig.id]: e.target.value }))
                      }
                      onBlur={() => saveCaption(fig)}
                      placeholder="Describe what this figure shows"
                    />
                  ) : (
                    <p className={`leading-relaxed ${captionText ? "text-slate-700" : "text-slate-400 italic"}`}>
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
        <p className="mt-4 text-sm text-slate-500">No figures uploaded yet.</p>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/80 p-4"
          onClick={() => setPreview(null)}
        >
          <div className="max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <img
              src={mediaUrl(preview.photo) || ""}
              alt={preview.caption || "Figure preview"}
              className="max-h-[80vh] max-w-full rounded-lg shadow-2xl"
            />
            {(preview.caption || "").trim() && (
              <p className="mt-3 text-center text-sm text-white/90">{preview.caption}</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export function PublicationFiguresGallery({ figures }: { figures: PublicationFigure[] }) {
  if (!figures.length) return null;
  return <PublicationFiguresEditor publicationId={0} figures={figures} onChange={() => {}} readOnly />;
}
