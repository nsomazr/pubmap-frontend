import { MapPin, Maximize2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { publicationMapLocationLabel } from "../../lib/publicationMapLocation";
import type { Publication } from "../../types";
import { ResearchMap } from "./ResearchMap";

interface Props {
  publication: Publication;
}

export function StudyLocationSection({ publication }: Props) {
  const [expanded, setExpanded] = useState(false);
  const locationLabel = publicationMapLocationLabel(publication);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  const mapProps = {
    publications: [publication],
    focusPublicationId: publication.id,
    variant: "embedded" as const,
    className: "rounded-none border-0",
  };

  const expandOverlay =
    expanded &&
    createPortal(
      <div className="study-location-expand fixed inset-0 z-[2000] flex flex-col bg-slate-900/50 p-3 sm:p-6">
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 shrink-0 text-brand-600" />
                <p className="font-semibold text-ink">Study location</p>
              </div>
              {locationLabel ? (
                <p className="mt-0.5 truncate pl-7 text-xs text-slate-500">{locationLabel}</p>
              ) : (
                <p className="mt-0.5 pl-7 text-xs text-slate-500">Use +/− to zoom · Esc to close</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              <X className="h-4 w-4" />
              Done
            </button>
          </div>
          <div className="relative min-h-0 flex-1">
            <ResearchMap {...mapProps} height="100%" />
          </div>
        </div>
      </div>,
      document.body
    );

  return (
    <>
      <section id="study-location" className="gre-card gre-card--study-map overflow-visible p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 shrink-0 text-brand-600" />
              <h2 className="gre-display font-semibold text-ink">Study location</h2>
            </div>
            {locationLabel ? (
              <p className="mt-0.5 truncate pl-7 text-xs text-slate-500">{locationLabel}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
          >
            <Maximize2 className="h-4 w-4" />
            Expand map
          </button>
        </div>
        {!expanded && <ResearchMap {...mapProps} height="380px" />}
      </section>
      {expandOverlay}
    </>
  );
}
