import { Loader2, ZoomIn } from "lucide-react";
import { useState } from "react";
import { useFigurePreviewUrls } from "../../hooks/useFigurePreviewUrls";
import type { PublicationFigure } from "../../lib/publicationGre";

function figureLabel(fig: PublicationFigure, index: number): string {
  return fig.figure_number?.trim() || `Figure ${index + 1}`;
}

type Props = {
  figures: PublicationFigure[];
  publicationId?: number | string;
  encodedPublicationId?: string | null;
  variant?: "composer" | "public";
};

export function PublicationFiguresDisplay({
  figures,
  publicationId = 0,
  encodedPublicationId,
  variant = "public",
}: Props) {
  const previewUrls = useFigurePreviewUrls(
    figures,
    publicationId,
    encodedPublicationId
  );
  const [lightbox, setLightbox] = useState<PublicationFigure | null>(null);

  if (!figures.length) return null;

  const shell =
    variant === "public"
      ? "gre-public-card min-w-0 overflow-hidden p-6 sm:p-8"
      : "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6";

  return (
    <section className={shell}>
      <h2 className="text-sm font-bold uppercase tracking-wider text-brand-600">
        Research figures
      </h2>
      <div className="mt-5 grid gap-6 sm:grid-cols-2">
        {figures.map((fig, index) => {
          const src = previewUrls[fig.id];
          const loading =
            Boolean((publicationId || fig.publication) && fig.id > 0) && src === undefined;
          const caption = (fig.caption || "").trim();

          return (
            <figure
              key={fig.id}
              className="flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50/40"
            >
              <button
                type="button"
                className="group relative block w-full bg-white"
                onClick={() => src && setLightbox(fig)}
                disabled={!src}
              >
                {src ? (
                  <img
                    src={src}
                    alt={caption || figureLabel(fig, index)}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[4/3] w-full object-contain p-2 transition group-hover:opacity-95"
                  />
                ) : loading ? (
                  <div className="flex aspect-[4/3] items-center justify-center gap-2 bg-slate-100 text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                    <span className="text-sm">Loading…</span>
                  </div>
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-slate-100 text-sm text-slate-400">
                    Preview unavailable
                  </div>
                )}
                {src && (
                  <span className="absolute right-2 top-2 rounded-full bg-white/95 p-1.5 shadow ring-1 ring-slate-200/80">
                    <ZoomIn className="h-4 w-4 text-brand-600" aria-hidden />
                  </span>
                )}
              </button>
              <figcaption className="border-t border-slate-100 bg-white px-3 py-2.5">
                <p className="text-xs font-bold uppercase tracking-wide text-brand-600">
                  {figureLabel(fig, index)}
                </p>
                <p
                  className={`mt-1 text-sm leading-relaxed ${
                    caption ? "text-slate-700" : "italic text-slate-400"
                  }`}
                >
                  {caption || "No caption provided."}
                </p>
              </figcaption>
            </figure>
          );
        })}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[2100] flex items-center justify-center bg-slate-900/85 p-4 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Figure preview"
        >
          <div
            className="relative flex max-h-[min(92vh,880px)] w-full max-w-[min(96vw,52rem)] flex-col overflow-hidden rounded-xl bg-slate-900/40"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewUrls[lightbox.id] || ""}
              alt={lightbox.caption || "Figure"}
              className="mx-auto max-h-[min(68vh,640px)] max-w-full object-contain p-4"
            />
            <p className="shrink-0 border-t border-white/10 px-4 py-3 text-center text-sm text-white">
              {figureLabel(
                lightbox,
                Math.max(0, figures.findIndex((f) => f.id === lightbox.id))
              )}
              {(lightbox.caption || "").trim() ? ` — ${lightbox.caption}` : ""}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
