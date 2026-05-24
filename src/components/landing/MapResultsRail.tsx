import { ChevronDown, ChevronLeft, ChevronRight, MapPin, Sparkles, X } from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { requestPublicationSummary } from "../map/publicationPopupSummary";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { ResearcherRankInline } from "../rankings/ResearcherRankInline";
import { SubcategoryBadge } from "../taxonomy/SubcategoryBadge";
import { UserAvatar } from "../ui/UserAvatar";
import { authorDisplayName } from "../../lib/userDisplay";
import { publicationSubcategoryVisual } from "../../lib/taxonomyVisuals";
import type { Publication } from "../../types";

interface Props {
  publications: Publication[];
  open: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onClose: () => void;
}

function formatLocation(pub: Publication): string | null {
  const c = pub.coordinates;
  if (!c) return null;
  const parts = [c.location, c.institution, c.study_area].filter(
    (p) => p && String(p).trim()
  );
  if (parts.length === 0) return null;
  const unique = [...new Set(parts.map((p) => String(p).trim()))];
  return unique.join(" · ");
}

export function MapResultsRail({
  publications,
  open,
  collapsed,
  onToggleCollapse,
  onClose,
}: Props) {
  const isMobile = useIsMobile();
  const swipeRef = useRef<{ startY: number } | null>(null);

  if (!open) return null;

  const handleSheetPointerDown = (clientY: number) => {
    swipeRef.current = { startY: clientY };
  };

  const handleSheetPointerUp = (clientY: number) => {
    const start = swipeRef.current;
    swipeRef.current = null;
    if (!start) return;
    if (clientY - start.startY > 56) {
      onToggleCollapse();
    }
  };

  const mobileToggle = (
    <button
      type="button"
      onClick={onToggleCollapse}
      className="map-results-rail-toggle fixed left-1/2 z-[1210] flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-xs font-semibold text-brand-700 shadow-lg ring-1 ring-slate-200/80"
      style={{
        bottom: collapsed
          ? "calc(3.75rem + env(safe-area-inset-bottom, 0px))"
          : "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
      }}
      aria-label={collapsed ? "Show search results" : "Hide search results"}
    >
      {collapsed ? (
        <>
          <ChevronDown className="h-4 w-4 rotate-180" />
          Show {publications.length} result{publications.length !== 1 ? "s" : ""}
        </>
      ) : (
        <>
          <ChevronDown className="h-4 w-4" />
          Hide results
        </>
      )}
    </button>
  );

  const desktopToggle = (
    <button
      type="button"
      onClick={onToggleCollapse}
      className="absolute top-1/2 z-[1210] hidden -translate-y-1/2 rounded-r-2xl bg-white py-8 pl-1.5 pr-2.5 shadow-xl ring-1 ring-slate-200/80 transition hover:bg-slate-50 md:flex"
      style={{ left: collapsed ? 0 : "min(400px, 92vw)" }}
      aria-label={collapsed ? "Expand results" : "Collapse results"}
    >
      {collapsed ? (
        <ChevronRight className="h-5 w-5 text-brand-600" />
      ) : (
        <ChevronLeft className="h-5 w-5 text-brand-600" />
      )}
    </button>
  );

  return (
    <>
      {isMobile && mobileToggle}
      {!isMobile && desktopToggle}

      {!collapsed && isMobile && (
        <button
          type="button"
          className="fixed inset-0 z-[1200] bg-slate-900/35"
          onClick={onToggleCollapse}
          aria-label="Dismiss search results"
        />
      )}

      <aside
        className={`map-results-rail z-[1205] flex flex-col bg-white shadow-2xl transition-all duration-300 ease-out ${
          isMobile
            ? `map-results-rail--mobile fixed inset-x-0 max-h-[min(68dvh,calc(100dvh-8rem))] rounded-t-2xl ${
                collapsed ? "pointer-events-none translate-y-full opacity-0" : "translate-y-0 opacity-100"
              }`
            : `absolute bottom-0 left-0 top-0 ${
                collapsed
                  ? "w-0 -translate-x-full opacity-0 pointer-events-none"
                  : "w-[min(400px,92vw)] translate-x-0 opacity-100"
              }`
        }`}
      >
        <div
          className="flex shrink-0 flex-col items-center border-b border-slate-100 bg-white px-5 pb-4 pt-3"
          onPointerDown={(e) => isMobile && handleSheetPointerDown(e.clientY)}
          onPointerUp={(e) => isMobile && handleSheetPointerUp(e.clientY)}
          onPointerCancel={(e) => isMobile && handleSheetPointerUp(e.clientY)}
        >
          {isMobile && (
            <span className="mb-3 h-1 w-12 rounded-full bg-slate-300" aria-hidden />
          )}
          <div className="relative w-full overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-600 to-teal-600 opacity-[0.08]" />
            <div className="relative flex items-start justify-between gap-3 py-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600">
                  Search results
                </p>
                <p className="mt-1 text-2xl font-bold text-ink">
                  {publications.length}
                  <span className="ml-1 text-base font-medium text-slate-500">
                    publication{publications.length !== 1 ? "s" : ""}
                  </span>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {isMobile && (
                  <button
                    type="button"
                    onClick={onToggleCollapse}
                    className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"
                  >
                    Minimize
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl bg-slate-100 p-2.5 text-slate-500 transition hover:bg-slate-200 hover:text-ink"
                  aria-label="Close search results"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-4 pb-6">
          {publications.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 px-4 py-12 text-center">
              <MapPin className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-600">No matches found</p>
              <p className="mt-1 text-xs text-slate-400">Try different search terms.</p>
            </div>
          ) : (
            <ul className="space-y-2.5 gre-stagger">
              {publications.map((pub, i) => {
                const location = formatLocation(pub);
                const subVisual = publicationSubcategoryVisual(pub);
                return (
                  <li key={pub.id}>
                    <article
                      className="group overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:bg-white hover:shadow-md"
                      style={{ animationDelay: `${i * 30}ms` }}
                    >
                      <Link
                        to={`/publication/${pub.id}`}
                        className="flex gap-3 p-3.5 pb-2.5"
                      >
                        <UserAvatar
                          user={pub.author}
                          size="sm"
                          className="h-11 w-11 rounded-xl border-2 text-sm"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:text-brand-700">
                            {pub.title}
                          </p>
                          <p className="mt-1 truncate text-xs text-slate-500">
                            {authorDisplayName(pub.author) ||
                              `${pub.author?.firstname ?? ""} ${pub.author?.lastname ?? ""}`.trim()}
                          </p>
                          <div className="mt-1.5">
                            <ResearcherRankInline ranking={pub.author?.ranking} compact />
                          </div>
                          {location && (
                            <p className="mt-1 flex items-start gap-1 text-xs text-slate-600">
                              <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-teal-600" />
                              <span className="line-clamp-2">{location}</span>
                            </p>
                          )}
                          {pub.abstract?.trim() && (
                            <p className="mt-2 line-clamp-2 text-xs leading-snug text-slate-600">
                              {pub.abstract.replace(/<[^>]+>/g, "").slice(0, 220)}
                            </p>
                          )}
                          {subVisual ? (
                            <div className="mt-2">
                              <SubcategoryBadge visual={subVisual} size="xs" />
                            </div>
                          ) : null}
                        </div>
                      </Link>
                      <div className="flex flex-col gap-2 px-3.5 pb-3.5 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => requestPublicationSummary(pub.id)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 transition hover:border-brand-300 hover:bg-brand-100"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          Get summary
                        </button>
                        <Link
                          to={`/publication/${pub.id}`}
                          className="flex flex-1 items-center justify-center rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
                        >
                          View PDF
                        </Link>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
