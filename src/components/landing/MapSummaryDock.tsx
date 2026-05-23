import { Loader2, MapPin, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
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

export function MapSummaryDock({ publication, onClose }: Props) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

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

  return (
    <aside className="map-summary-dock pointer-events-auto" aria-live="polite">
      <div className="map-summary-dock-card">
        <header className="map-summary-dock-header">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span className={`${greAccentBadge} h-9 w-9 shrink-0 rounded-xl shadow-md`}>
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
                Research summary
              </p>
              <h3 className="line-clamp-2 text-base font-bold leading-snug text-ink">
                {publication.title}
              </h3>
              <p className="mt-1 truncate text-xs font-medium text-slate-600">{author}</p>
              {location && (
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3 w-3 shrink-0 text-teal-600" />
                  <span className="truncate">{location}</span>
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-ink"
            aria-label="Close summary"
          >
            <X className="h-4 w-4" />
          </button>
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
          <Link
            to={`/publication/${publication.id}`}
            className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700"
          >
            View full publication
          </Link>
        </footer>
      </div>
    </aside>
  );
}
