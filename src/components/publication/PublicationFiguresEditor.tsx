import { ImagePlus, Trash2, ZoomIn } from "lucide-react";
import { useRef, useState } from "react";
import { deleteFigure, uploadFigure, type PublicationFigure } from "../../lib/publicationGre";
import { mediaUrl } from "../../lib/mediaUrl";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

interface Props {
  publicationId: number;
  figures: PublicationFigure[];
  onChange: (figures: PublicationFigure[]) => void;
  readOnly?: boolean;
}

export function PublicationFiguresEditor({ publicationId, figures, onChange, readOnly }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<PublicationFigure | null>(null);
  const [draft, setDraft] = useState({ title: "", caption: "", figure_number: "" });

  const onFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file || readOnly) return;
    setUploading(true);
    try {
      const fig = (await uploadFigure(publicationId, file, draft)) as PublicationFigure;
      onChange([...figures, fig]);
      setDraft({ title: "", caption: "", figure_number: "" });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async (id: number) => {
    await deleteFigure(publicationId, id);
    onChange(figures.filter((f) => f.id !== id));
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 ring-1 ring-slate-200/80 sm:p-6">
      <h3 className="text-sm font-bold uppercase tracking-wider text-brand-600">Research figures</h3>
      <p className="mt-1 text-sm text-slate-600">
        Upload charts, diagrams, and images with captions. They appear on the public publication page.
      </p>

      {!readOnly && (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Input label="Figure label" value={draft.figure_number} onChange={(e) => setDraft((d) => ({ ...d, figure_number: e.target.value }))} placeholder="Fig. 1" />
          <Input label="Title" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} placeholder="Geological map" />
          <Input label="Caption" value={draft.caption} onChange={(e) => setDraft((d) => ({ ...d, caption: e.target.value }))} placeholder="Brief caption" />
        </div>
      )}

      {!readOnly && (
        <div className="mt-4">
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFiles(e.target.files)} />
          <Button type="button" variant="secondary" loading={uploading} onClick={() => inputRef.current?.click()}>
            <ImagePlus className="h-4 w-4" />
            Add figure
          </Button>
        </div>
      )}

      {figures.length > 0 ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {figures.map((fig) => {
            const src = mediaUrl(fig.photo);
            return (
              <figure key={fig.id} className="group overflow-hidden rounded-xl ring-1 ring-slate-200">
                <button type="button" className="relative block w-full" onClick={() => setPreview(fig)}>
                  {src ? (
                    <img src={src} alt={fig.title || fig.caption || "Figure"} className="aspect-[4/3] w-full object-cover transition group-hover:scale-[1.02]" />
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center bg-slate-100 text-slate-400">No preview</div>
                  )}
                  <span className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 shadow">
                    <ZoomIn className="h-4 w-4 text-brand-600" />
                  </span>
                </button>
                <figcaption className="space-y-1 p-3 text-sm">
                  {(fig.figure_number || fig.title) && (
                    <p className="font-semibold text-ink">
                      {[fig.figure_number, fig.title].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {fig.caption && <p className="text-slate-600">{fig.caption}</p>}
                  {!readOnly && (
                    <button type="button" onClick={() => remove(fig.id)} className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline">
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
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/80 p-4" onClick={() => setPreview(null)}>
          <img src={mediaUrl(preview.photo) || ""} alt="" className="max-h-[90vh] max-w-full rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </section>
  );
}

export function PublicationFiguresGallery({ figures }: { figures: PublicationFigure[] }) {
  if (!figures.length) return null;
  return <PublicationFiguresEditor publicationId={0} figures={figures} onChange={() => {}} readOnly />;
}
