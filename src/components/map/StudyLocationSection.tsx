import { Download, Eye, FileText, MapPin, Maximize2, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { abstractListingSnippet } from "../../lib/abstractText";
import { formatGrePaperTitle, grePaperCode } from "../../lib/grePaperTitle";
import {
  GET_PUBLICATION_SUMMARY_LABEL,
  buildPublicationChatPath,
} from "../../lib/publicationChat";
import { requestPublicationSummary } from "./publicationPopupSummary";
import { buildPublicationPath } from "../../lib/publicationPaths";
import { publicationSubcategoryVisual } from "../../lib/taxonomyVisuals";
import type { Publication } from "../../types";
import { SubcategoryBadge } from "../taxonomy/SubcategoryBadge";
import { UserAvatar } from "../ui/UserAvatar";
import { ResearchMap } from "./ResearchMap";

function StudyLocationInfoPanel({
  publication,
  chatPath,
}: {
  publication: Publication;
  chatPath: string;
}) {
  const author =
    publication.author?.full_name ||
    `${publication.author?.firstname ?? ""} ${publication.author?.lastname ?? ""}`.trim();
  const subVisual = publicationSubcategoryVisual(publication);
  const location = publication.coordinates?.location?.trim();
  const views = publication.views_count ?? 0;
  const downloads = publication.downloads_count ?? 0;
  const paperCode = grePaperCode(publication.short_number);
  const title = formatGrePaperTitle(publication.title, publication.short_number);
  const abstractSnippet = abstractListingSnippet(publication.abstract, 280);

  return (
    <div className="study-location-info border-t border-slate-100 bg-white px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        {author ? (
          <div className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 py-1 pl-1 pr-2.5">
            <UserAvatar
              user={publication.author}
              size="sm"
              className="!h-8 !w-8 shrink-0 !border-0 !text-[10px]"
            />
            <span className="truncate text-xs font-semibold text-slate-700">{author}</span>
          </div>
        ) : null}
        {subVisual ? <SubcategoryBadge visual={subVisual} size="xs" variant="chip" /> : null}
      </div>

      <div className="mt-3 min-w-0 border-l-[3px] border-brand-500 pl-3">
        {paperCode ? (
          <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-brand-700">
            {paperCode}
          </p>
        ) : null}
        <h3 className="mt-0.5 text-sm font-semibold leading-snug text-ink sm:text-base">{title}</h3>
        {location && (
          <p className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-500">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
            <span>{location}</span>
          </p>
        )}
      </div>

      {abstractSnippet ? (
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{abstractSnippet}</p>
      ) : null}

      <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200/80">
            <Eye className="h-3.5 w-3.5 text-brand-600" />
            {views} {views === 1 ? "view" : "views"}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200/80">
            <Download className="h-3.5 w-3.5 text-brand-600" />
            {downloads} {downloads === 1 ? "download" : "downloads"}
          </span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Link
            to={chatPath}
            onClick={(event) => {
              event.preventDefault();
              requestPublicationSummary(publication.id, publication.encoded_id);
            }}
            className="gre-interactive inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-brand-200 hover:bg-brand-50/50 hover:text-brand-800 sm:shrink-0"
          >
            <Sparkles className="h-4 w-4 text-brand-600" />
            {GET_PUBLICATION_SUMMARY_LABEL}
          </Link>
          <Link
            to={buildPublicationPath(publication.id, publication.encoded_id)}
            className="gre-interactive inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-600/20 transition hover:bg-brand-700 sm:shrink-0"
          >
            <FileText className="h-4 w-4" />
            View publication
          </Link>
        </div>
      </div>
    </div>
  );
}

interface Props {
  publication: Publication;
}

export function StudyLocationSection({ publication }: Props) {
  const [expanded, setExpanded] = useState(false);
  const chatPath = buildPublicationChatPath(publication.id, publication.encoded_id);

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
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 shrink-0 text-brand-600" />
              <div>
                <p className="font-semibold text-ink">Study location</p>
                <p className="text-xs text-slate-500">Use +/− to zoom · Esc to close</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              <X className="h-4 w-4" />
              Done
            </button>
          </div>
          <div className="relative min-h-0 flex-1">
            <ResearchMap {...mapProps} height="100%" />
          </div>
          <StudyLocationInfoPanel publication={publication} chatPath={chatPath} />
        </div>
      </div>,
      document.body
    );

  return (
    <>
      <section id="study-location" className="gre-card gre-card--study-map overflow-visible p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-brand-600" />
            <h2 className="gre-display font-semibold text-ink">Study location</h2>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
          >
            <Maximize2 className="h-4 w-4" />
            Expand map
          </button>
        </div>
        {!expanded && <ResearchMap {...mapProps} height="380px" />}
        <StudyLocationInfoPanel publication={publication} chatPath={chatPath} />
      </section>
      {expandOverlay}
    </>
  );
}
