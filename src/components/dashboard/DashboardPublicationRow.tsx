import { AlertTriangle, ArrowRight, FileText, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { abstractListingSnippet } from "../../lib/abstractText";
import { formatGrePaperTitle, grePaperCode } from "../../lib/grePaperTitle";
import { authorDisplayName } from "../../lib/userDisplay";
import { publicationSubcategoryVisual } from "../../lib/taxonomyVisuals";
import { StatusBadge } from "./StatusBadge";
import { SubcategoryVisual } from "../taxonomy/SubcategoryVisual";
import type { Publication } from "../../types";

const STATUS_ACCENT: Record<number, string> = {
  0: "border-l-slate-300",
  1: "border-l-violet-400",
  2: "border-l-amber-400",
  3: "border-l-teal-500",
  4: "border-l-slate-400",
  6: "border-l-slate-500",
};

type Props = {
  pub: Publication;
  href: string;
  workflowHint: string;
  reviewPending?: boolean;
  hasDoc?: boolean;
  showClaim?: boolean;
};

export function DashboardPublicationRow({
  pub,
  href,
  workflowHint,
  reviewPending = false,
  hasDoc = false,
  showClaim = false,
}: Props) {
  const subVisual = publicationSubcategoryVisual(pub);
  const paperCode = grePaperCode(pub.short_number);
  const title = formatGrePaperTitle(pub.title, pub.short_number, {
    fallback: "Untitled publication",
  });
  const author = authorDisplayName(pub.author);
  const snippet = abstractListingSnippet(pub.abstract);
  const accent = STATUS_ACCENT[pub.status] ?? STATUS_ACCENT[0];

  return (
    <Link
      to={href}
      className={`group flex gap-4 border-l-4 bg-white px-4 py-4 transition hover:bg-brand-50/30 sm:gap-5 sm:px-5 sm:py-5 ${accent}`}
    >
      <div className="shrink-0">
        {subVisual ? (
          <SubcategoryVisual
            visual={subVisual}
            size="md"
            fit="contain"
            clip={false}
            shadow={false}
            className="!h-14 !w-14 sm:!h-16 sm:!w-16"
          />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-500 sm:h-16 sm:w-16">
            <FileText className="h-6 w-6" />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {paperCode && (
              <span className="rounded-md bg-slate-900 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-white">
                {paperCode}
              </span>
            )}
            <StatusBadge status={pub.status} />
            {showClaim && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-900 ring-1 ring-amber-200">
                <AlertTriangle className="h-3 w-3" />
                Plagiarism claim
              </span>
            )}
          </div>
          <ArrowRight className="hidden h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600 sm:block" />
        </div>

        {author && (
          <p className="mt-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
            {author}
          </p>
        )}

        <h3 className="mt-0.5 line-clamp-2 text-base font-semibold leading-snug text-ink group-hover:text-brand-800 sm:text-[1.05rem]">
          {title}
        </h3>

        {snippet && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-500">{snippet}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-600">
          {(pub.sub_category_name || pub.subfield_name) && (
            <span className="font-medium text-slate-700">
              {pub.subfield_name || pub.sub_category_name}
            </span>
          )}
          {pub.coordinates?.location && (
            <span className="inline-flex min-w-0 items-center gap-1 text-slate-500">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-teal-600" />
              <span className="truncate max-w-full sm:max-w-xs">{pub.coordinates.location}</span>
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p
            className={`text-xs font-medium ${
              pub.status === 2 || showClaim
                ? "text-amber-800"
                : pub.status === 1
                  ? "text-violet-700"
                  : "text-slate-500"
            }`}
          >
            {workflowHint}
          </p>
          {reviewPending && (
            <span className="text-[10px] font-bold uppercase tracking-wide text-brand-600">
              {hasDoc ? "Review PDF" : "No manuscript file"}
            </span>
          )}
          <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 sm:hidden" />
        </div>
      </div>
    </Link>
  );
}
