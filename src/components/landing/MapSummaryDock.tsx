import { ChevronDown, ChevronUp, GripVertical, Loader2, MapPin, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMapPanelLayout } from "../../context/MapPanelLayoutContext";
import { assistantSummarizePublicationStream } from "../../lib/assistant";
import { FormattedAssistantText } from "../../lib/formatAssistantText";
import { greAccentBadge } from "../../lib/greTheme";
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
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const [minimized, setMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!publication) return;
    setMinimized(false);
  }, [publication?.id]);

  useEffect(() => {
    if (!publication) return;

    abortRef.current?.abort();
    setSummary("");
    setError("");
    setLoading(true);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    assistantSummarizePublicationStream(
      publication.id,
      {
        onToken: (t) => setSummary((s) => s + t),
        onError: (msg) => setError(msg),
        onDone: () => {
          setStreaming(false);
          setLoading(false);
        },
      },
      controller.signal
    )
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setError(
          err.message ||
            "GRE Assistant is temporarily unavailable. Please try again in a moment."
        );
        setLoading(false);
        setStreaming(false);
      });

    return () => controller.abort();
  }, [publication?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [summary]);

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
            <p className="truncate text-[11px] text-slate-500">{publication.title}</p>
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
            <span className={`${greAccentBadge} h-9 w-9 shrink-0 rounded-xl shadow-md`}>
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
                Research summary
              </p>
              <h3 className="line-clamp-2 text-left text-base font-bold leading-snug text-ink">
                {publication.title}
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
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-ink"
              aria-label="Minimize summary"
            >
              <ChevronDown className="h-4 w-4" />
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
        </header>

        <div ref={scrollRef} className="map-summary-dock-body">
          {error ? (
            <p className="text-sm text-amber-800">{error}</p>
          ) : !summary && loading ? (
            <span className="inline-flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Generating summary…
            </span>
          ) : (
            <FormattedAssistantText content={summary} streaming={streaming} />
          )}
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
