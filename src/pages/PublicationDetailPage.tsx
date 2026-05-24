import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AlertTriangle, MapPin } from "lucide-react";
import { formatGrePaperTitle } from "../lib/grePaperTitle";
import api from "../lib/api";
import { ReportPlagiarismDialog } from "../components/publication/ReportPlagiarismDialog";
import { PublicationSummaryAssistant } from "../components/publication/PublicationSummaryAssistant";
import { GreAdPlacement } from "../components/ads/GreAdSlot";
import { ResearcherRankInline } from "../components/rankings/ResearcherRankInline";
import { StarRating } from "../components/rankings/StarRating";
import { GreDoiBadge } from "../components/publication/GreDoiBadge";
import { PdfPreview } from "../components/publication/PdfPreview";
import { PublicationDiscussions } from "../components/publication/PublicationDiscussions";
import { CoAuthorsPanel } from "../components/publication/CoAuthorsPanel";
import { PublicationDownloadPanel } from "../components/publication/PublicationDownloadPanel";
import { PublicationFiguresEditor } from "../components/publication/PublicationFiguresEditor";
import { PublicationManuscriptSection } from "../components/publication/PublicationManuscriptSection";
import { PublicationPaperHeader } from "../components/publication/PublicationPaperHeader";
import { UserAvatar } from "../components/ui/UserAvatar";
import { PublicPageLayout } from "../components/layout/PublicPageLayout";
import { ResearchMap } from "../components/map/ResearchMap";
import { abstractPlainText } from "../lib/abstractText";
import { publicationSubcategoryVisual } from "../lib/taxonomyVisuals";
import { authorBylineFromPublication } from "../lib/publicationAuthors";
import type { Publication } from "../types";

function formatPublishedDate(value?: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function PublicationDetailPage() {
  const { id } = useParams();
  const [reportOpen, setReportOpen] = useState(false);

  const { data: pub, isLoading, isError } = useQuery({
    queryKey: ["publication", id],
    queryFn: async () => {
      const { data } = await api.get<Publication>(`/publications/${id}/public/`);
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (pub?.id) {
      api.post("/stats/record/", { publication_id: pub.id, type: "view" }).catch(() => {});
    }
  }, [pub?.id]);

  const docPath = pub?.documents?.[0]?.document ?? null;
  const isClosed = pub?.gre?.access_type === "closed";
  const hasPdf = Boolean(docPath?.toLowerCase().endsWith(".pdf")) && !isClosed;

  if (isLoading) {
    return (
      <PublicPageLayout compactHero title="Publication" crumbs={[{ label: "Home", to: "/" }]}>
        <p className="text-slate-500">Loading…</p>
      </PublicPageLayout>
    );
  }

  if (isError || !pub) {
    return (
      <PublicPageLayout
        compactHero
        title="Not found"
        crumbs={[{ label: "Home", to: "/" }]}
        back={{ to: "/", label: "Back to map" }}
      >
        <p className="text-slate-600">Publication not found or not yet published.</p>
      </PublicPageLayout>
    );
  }

  const authorName =
    pub.author?.full_name ||
    `${pub.author?.firstname ?? ""} ${pub.author?.lastname ?? ""}`.trim();
  const subVisual = publicationSubcategoryVisual(pub);
  const abstractPlain = abstractPlainText(pub.abstract);
  const locationLabel = [pub.coordinates?.location, pub.coordinates?.institution]
    .filter(Boolean)
    .join(" · ");

  const crumbTitle = formatGrePaperTitle(pub.title, pub.short_number);

  return (
    <PublicPageLayout
      wide
      compactHero
      accent="blue"
      title="Publication"
      crumbs={[
        { label: "Home", to: "/" },
        {
          label: crumbTitle.slice(0, 48) + (crumbTitle.length > 48 ? "…" : ""),
        },
      ]}
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="gre-section-stack min-w-0 space-y-5">
          <PublicationPaperHeader
            title={pub.title}
            greNumber={pub.short_number}
            authorByline={authorBylineFromPublication(pub)}
            subVisual={subVisual}
            subCategoryName={pub.sub_category_name}
            publishedLabel={formatPublishedDate(pub.created_at)}
            location={locationLabel || undefined}
            viewsCount={pub.views_count ?? 0}
            downloadsCount={pub.downloads_count ?? 0}
            discussionsCount={pub.discussions_count ?? 0}
            accessType={pub.gre?.access_type}
          />

          <section
            id="publication-summary"
            className="gre-card grid grid-cols-1 gap-4 p-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-6 sm:p-8"
          >
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold uppercase tracking-wider text-brand-600">Abstract</h2>
              <p className="mt-4 text-base leading-relaxed text-slate-700">
                {abstractPlain?.trim() || "No abstract provided."}
              </p>
              {pub.keywords && pub.keywords.length > 0 && (
                <p className="mt-4 text-sm text-slate-600">
                  <span className="font-semibold text-slate-700">Keywords: </span>
                  {pub.keywords.join(", ")}
                </p>
              )}
              {pub.funder?.trim() && (
                <p className="mt-4 text-sm text-slate-600">
                  <span className="font-semibold text-slate-700">Project funders: </span>
                  {pub.funder.trim()}
                </p>
              )}
              {pub.gre?.gre_doi && (
                <div className="mt-4">
                  <GreDoiBadge greDoi={pub.gre.gre_doi} greDoiUrl={pub.gre.gre_doi_url} />
                </div>
              )}
            </div>
            <PublicationSummaryAssistant publicationId={pub.id} layout="detail" />
          </section>

          <PublicationDownloadPanel
            publicationId={pub.id}
            gre={pub.gre}
            documents={pub.documents}
            isClosed={isClosed}
            publicationTitle={crumbTitle}
          />

          {hasPdf && docPath ? (
            <section className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-7">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-brand-600">
                    Manuscript PDF
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">Full open-access paper</p>
                </div>
              </div>
              <PdfPreview documentPath={docPath} className="min-h-[min(75vh,900px)] rounded-none border-0" />
            </section>
          ) : (
            <div className="space-y-4">
              <PublicationManuscriptSection title="Introduction" body={pub.introduction} />
              <PublicationManuscriptSection title="Methods" body={pub.methods} />
              <PublicationManuscriptSection title="Results" body={pub.results} />
              <PublicationManuscriptSection title="Findings / discussion" body={pub.findings} />
              <PublicationManuscriptSection title="Conclusion" body={pub.conclusion} />
            </div>
          )}

          {(pub.figures?.length ?? 0) > 0 && (
            <PublicationFiguresEditor
              publicationId={pub.id}
              figures={pub.figures ?? []}
              onChange={() => {}}
              readOnly
            />
          )}

          {pub.coordinates && (
            <section className="gre-card p-0">
              <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
                <MapPin className="h-5 w-5 text-brand-600" />
                <h2 className="gre-display font-semibold text-ink">Study location</h2>
              </div>
              <ResearchMap
                publications={[pub]}
                focusPublicationId={pub.id}
                height="420px"
                variant="embedded"
                className="rounded-none border-0"
              />
            </section>
          )}

          <PublicationDiscussions publicationId={pub.id} coAuthors={pub.co_authors} />
          <CoAuthorsPanel publication={pub} />

          <section className="gre-card border-amber-100 bg-amber-50/30 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-950">
                  <AlertTriangle className="h-4 w-4" />
                  Research integrity
                </h2>
                <p className="mt-1 text-sm text-amber-900/90">
                  Report concerns about originality or attribution. GRE reviews all reports.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-50"
              >
                Report concern
              </button>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <div className="gre-card p-5">
            <div className="flex items-center gap-3">
              <UserAvatar user={pub.author} size="md" />
              <div className="min-w-0">
                <p className="font-semibold text-ink">{authorName}</p>
                <p className="truncate text-xs text-slate-500">{pub.author?.affiliation}</p>
              </div>
            </div>
            {pub.author?.ranking && (
              <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                <ResearcherRankInline ranking={pub.author.ranking} />
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <StarRating stars={pub.author.ranking.stars} size="sm" />
                  <span>{pub.author.ranking.published_count} on GRE</span>
                </div>
              </div>
            )}
            {pub.author?.id && (
              <Link
                to={`/researcher/${pub.author.id}`}
                className="mt-4 inline-flex text-sm font-semibold text-brand-600 hover:underline"
              >
                View researcher profile
              </Link>
            )}
          </div>
          <GreAdPlacement placement="sidebar" limit={4} rotate />
        </aside>
      </div>

      {reportOpen && (
        <ReportPlagiarismDialog
          publicationId={pub.id}
          publicationTitle={pub.title}
          onClose={() => setReportOpen(false)}
        />
      )}
    </PublicPageLayout>
  );
}
