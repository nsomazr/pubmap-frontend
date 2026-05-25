import { ChevronDown, ChevronUp, GripVertical, MapPin, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PublicationSummaryAssistant } from "../publication/PublicationSummaryAssistant";
import { UserAvatar } from "../ui/UserAvatar";
import { useMapPanelLayout } from "../../context/MapPanelLayoutContext";
import { formatGrePaperTitle } from "../../lib/grePaperTitle";
import type { Publication } from "../../types";

interface Props {
  publication: Publication | null;
  onClose: () => void;
}

function formatLocation(pub: Publication): string | null {
  const c = pub.coordinates;
  if (!c) return null;
  const parts = [c.location, c.institution].filter((p) => p && String(p).trim());
  return parts.length ? parts.join(" · ") : null;
}

function SummaryDragHandle() {
  const { dragHandlers, dragEnabled } = useMapPanelLayout();
  if (!dragEnabled) return null;
  return (
    <button
      type="button"
      aria-label="Drag summary panel"
      onPointerDown={dragHandlers.onPointerDown}
      onPointerMove={dragHandlers.onPointerMove}
      onPointerUp={dragHandlers.onPointerUp}
      onPointerCancel={dragHandlers.onPointerUp}
      className="map-drag-handle flex shrink-0 cursor-grab items-center justify-center rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600 active:cursor-grabbing"
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );
}

export function MapSummaryDock({ publication, onClose }: Props) {
  const [minimized, setMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!publication) return;
    setMinimized(false);
  }, [publication?.id]);

  if (!publication) return null;

  const author =
    publication.author?.full_name ||
    `${publication.author?.firstname ?? ""} ${publication.author?.lastname ?? ""}`.trim();
  const location = formatLocation(publication);

  if (minimized) {
    return (
      <aside className="map-summary-dock pointer-events-auto w-full" aria-live="polite">
        <div className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2.5 shadow-lg ring-1 ring-slate-200/90">
          <SummaryDragHandle />
          <button
            type="button"
            onClick={() => setMinimized(false)}
            className="min-w-0 flex-1 text-left"
          >
            <p className="truncate text-xs font-semibold text-brand-700">Research summary</p>
            <p className="truncate text-[11px] text-slate-500">
              {formatGrePaperTitle(publication.title, publication.short_number)}
            </p>
          </button>
          <button
            type="button"
            onClick={() => setMinimized(false)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
            aria-label="Expand summary"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-ink"
            aria-label="Close summary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="map-summary-dock pointer-events-auto w-full" aria-live="polite">
      <div className="map-summary-dock-card">
        <div className="flex items-center justify-center pt-2 md:hidden">
          <span className="h-1 w-10 rounded-full bg-slate-200" aria-hidden />
        </div>
        <header className="map-summary-dock-header">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <SummaryDragHandle />
            <UserAvatar
              user={publication.author}
              size="md"
              className="!h-9 !w-9 shrink-0 !border-2 !text-[11px]"
            />
            <div className="min-w-0 flex-1 text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
                Research summary
              </p>
              <h3 className="line-clamp-2 text-left text-base font-bold leading-snug text-ink">
                {formatGrePaperTitle(publication.title, publication.short_number)}
              </h3>
              <p className="mt-1 truncate text-left text-xs font-medium text-slate-600">{author}</p>
              {location && (
                <p className="mt-1 flex items-center gap-1 text-left text-xs text-slate-500">
                  <MapPin className="h-3 w-3 shrink-0 text-teal-600" />
                  <span className="truncate">{location}</span>
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-0.5 self-start pt-0.5">
            <button
              type="button"
              onClick={() => setMinimized(true)}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-ink"
              aria-label="Minimize summary"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-ink"
              aria-label="Close summary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div ref={scrollRef} className="map-summary-dock-body">
          <PublicationSummaryAssistant
            key={publication.id}
            publicationId={publication.id}
            autoGenerate
            layout="dock"
            scrollContainerRef={scrollRef}
          />
        </div>

        <footer className="map-summary-dock-footer">
          <p className="mb-2 text-left text-[10px] text-slate-400 md:hidden">
            Drag the handle to move this panel
          </p>
          <Link
            to={`/publication/${publication.id}`}
            className="inline-flex w-full items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700"
          >
            View full publication
          </Link>
        </footer>
      </div>
    </aside>
  );
}
