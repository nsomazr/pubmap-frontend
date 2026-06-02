import { Loader2, ZoomIn } from "lucide-react";
import { useState } from "react";
import { useFigurePreviewUrls } from "../../hooks/useFigurePreviewUrls";
import type { PublicationFigure } from "../../lib/publicationGre";
import { FigureLightbox } from "./FigureLightbox";

function figureLabel(fig: PublicationFigure, index: number): string {
  return fig.figure_number?.trim() || `Figure ${index + 1}`;
}

type Props = {
  figures: PublicationFigure[];
  publicationId?: number | string;
  encodedPublicationId?: string | null;
  variant?: "composer" | "public";
  layout?: "card" | "flat";
};

export function PublicationFiguresDisplay({
  figures,
  publicationId = 0,
  encodedPublicationId,
  variant = "public",
  layout = "card",
}: Props) {
  const previewUrls = useFigurePreviewUrls(
    figures,
    publicationId,
    encodedPublicationId
  );
  const [lightbox, setLightbox] = useState<PublicationFigure | null>(null);

  if (!figures.length) return null;

  const flat = layout === "flat";
  const shell = flat
    ? "min-w-0 scroll-mt-4"
    : variant === "public"
      ? "gre-public-card min-w-0 overflow-hidden p-6 sm:p-8"
      : "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6";

  return (
    <section className={shell}>
      <h2
        className={
          flat
            ? variant === "public"
              ? "text-sm font-bold uppercase tracking-wider text-brand-600"
              : "text-xs font-bold uppercase tracking-wider text-slate-500"
            : "text-sm font-bold uppercase tracking-wider text-brand-600"
        }
      >
        Research figures
      </h2>
      <div className={`grid gap-6 sm:grid-cols-2 ${flat ? "mt-4" : "mt-5"}`}>
        {figures.map((fig, index) => {
          const src = previewUrls[fig.id];
          const loading =
            Boolean((publicationId || fig.publication) && fig.id > 0) && src === undefined;
          const caption = (fig.caption || "").trim();

          return (
            <figure
              key={fig.id}
              className={
                flat
                  ? "flex flex-col gap-2"
                  : "flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50/40"
              }
            >
              <button
                type="button"
                className={`group relative block w-full ${flat ? "rounded-lg bg-slate-50/80" : "bg-white"}`}
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
              <figcaption className={flat ? "px-0.5" : "border-t border-slate-100 bg-white px-3 py-2.5"}>
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

      <FigureLightbox
        open={Boolean(lightbox)}
        onClose={() => setLightbox(null)}
        src={lightbox ? previewUrls[lightbox.id] || "" : ""}
        alt={lightbox?.caption || "Figure"}
      >
        {lightbox ? (
          <p>
            {figureLabel(
              lightbox,
              Math.max(0, figures.findIndex((f) => f.id === lightbox.id))
            )}
            {(lightbox.caption || "").trim() ? ` — ${lightbox.caption}` : ""}
          </p>
        ) : null}
      </FigureLightbox>
    </section>
  );
}
