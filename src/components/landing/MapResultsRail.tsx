import { ChevronLeft, ChevronRight, MapPin, Sparkles, X } from "lucide-react";
import { useRef } from "react";
import { createPortal } from "react-dom";
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
    if (clientY - start.startY > 48) {
      onToggleCollapse();
    }
  };

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

  const countLabel = `${publications.length} publication${publications.length !== 1 ? "s" : ""}`;

  const sheet = (
    <>
      {!isMobile && desktopToggle}

      {!collapsed && isMobile && (
        <button
          type="button"
          className="fixed inset-0 z-[1290] bg-slate-900/30"
          onClick={onToggleCollapse}
          aria-label="Hide search results"
        />
      )}

      <aside
        className={`map-results-rail z-[1295] flex flex-col bg-white shadow-2xl transition-all duration-300 ease-out ${
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
          className="map-results-rail-header flex shrink-0 cursor-grab flex-col border-b border-slate-100 bg-white px-4 pb-3 pt-2 active:cursor-grabbing"
          onPointerDown={(e) => isMobile && handleSheetPointerDown(e.clientY)}
          onPointerUp={(e) => isMobile && handleSheetPointerUp(e.clientY)}
          onPointerCancel={(e) => isMobile && handleSheetPointerUp(e.clientY)}
        >
          {isMobile && (
            <span className="mx-auto mb-2.5 h-1 w-10 rounded-full bg-slate-300" aria-hidden />
          )}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 text-left">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">
                Search results
              </p>
              <p className="mt-0.5 text-lg font-bold leading-tight text-ink">{countLabel}</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="shrink-0 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-ink"
              aria-label="Close search results"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 pb-4">
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
                        <div className="min-w-0 flex-1 text-left">
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

  if (isMobile) return createPortal(sheet, document.body);
  return sheet;
}
