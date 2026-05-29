import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, PencilLine } from "lucide-react";
import api from "../../lib/api";
import {
  buildDashboardPublicationPath,
  publicationApiSegment,
} from "../../lib/publicationPaths";
import { formatGrePaperTitle } from "../../lib/grePaperTitle";
import { ReportPlagiarismDialog } from "../../components/publication/ReportPlagiarismDialog";
import { GreAdPlacement } from "../../components/ads/GreAdSlot";
import { RankedNameLabel } from "../../components/rankings/RankedNameLabel";
import { PdfPreview } from "../../components/publication/PdfPreview";
import { PublicationDiscussions } from "../../components/publication/PublicationDiscussions";
import { CoAuthorsPanel } from "../../components/publication/CoAuthorsPanel";
import { PublicationDownloadPanel } from "../../components/publication/PublicationDownloadPanel";
import { PublicationFiguresEditor } from "../../components/publication/PublicationFiguresEditor";
import { PublicationManuscriptSection } from "../../components/publication/PublicationManuscriptSection";
import { PublicationPaperHeader } from "../../components/publication/PublicationPaperHeader";
import { UserAvatar } from "../../components/ui/UserAvatar";
import { StudyLocationSection } from "../../components/map/StudyLocationSection";
import { ManuscriptContent } from "../../components/publication/ManuscriptContent";
import { publicationSubcategoryVisual } from "../../lib/taxonomyVisuals";
import { authorBylineFromPublication } from "../../lib/publicationAuthors";
import { publicationMapLocationLabel } from "../../lib/publicationMapLocation";
import type { Publication } from "../../types";

function formatPublishedDate(value?: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function PublicationReaderPage() {
  const { id } = useParams();
  const [reportOpen, setReportOpen] = useState(false);

  const { data: pub, isLoading, isError } = useQuery({
    queryKey: ["publication-reader", id],
    queryFn: async () => {
      const { data } = await api.get<Publication>(
        `/publications/${publicationApiSegment(id!)}/reader/`
      );
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (pub?.id) {
      api.post("/stats/record/", { publication_id: pub.id, type: "view" }).catch(() => {});
    }
  }, [pub?.id]);

  if (!id) return <Navigate to="/dashboard/publications" replace />;
  if (isLoading) return <p className="text-slate-500">Loading publication...</p>;
  if (isError || !pub) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
        Publication not found.
      </div>
    );
  }

  const manuscript = pub.documents?.find((doc) => !doc.kind || doc.kind === "manuscript") ?? null;
  const docPath = manuscript?.document ?? null;
  const isClosed = pub.gre?.access_type === "closed";
  const showManuscriptContent = Boolean(docPath?.trim()) && !isClosed;
  const showPdfPreview = showManuscriptContent && Boolean(docPath?.toLowerCase().endsWith(".pdf"));
  const authorName =
    pub.author?.full_name ||
    `${pub.author?.firstname ?? ""} ${pub.author?.lastname ?? ""}`.trim();
  const subVisual = publicationSubcategoryVisual(pub);
  const locationLabel = publicationMapLocationLabel(pub);
  const manuscriptSections = [
    { title: "Introduction", body: pub.introduction },
    { title: "Methods", body: pub.methods },
    {
      title: "Findings",
      body: pub.findings,
    },
    { title: "Conclusion", body: pub.conclusion },
  ].filter((section) => Boolean(section.body?.trim()));
  const crumbTitle = formatGrePaperTitle(pub.title, pub.short_number);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <Link
          to="/dashboard/publications"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to publications
        </Link>
        <Link
          to={buildDashboardPublicationPath(pub.id, pub.encoded_id)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          <PencilLine className="h-4 w-4" />
          Edit publication
        </Link>
      </div>

      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_280px]">
        <aside className="order-1 space-y-6 lg:order-2">
          <div className="gre-card p-5">
            <div className="flex items-center gap-3">
              <UserAvatar user={pub.author} size="md" />
              <div className="min-w-0">
                <RankedNameLabel
                  name={authorName}
                  nameClassName="font-semibold text-ink"
                  ranking={pub.author?.ranking}
                />
                <p className="truncate text-xs text-slate-500">{pub.author?.affiliation}</p>
              </div>
            </div>
            {pub.author?.ranking && (
              <div className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-600">
                <span>{pub.author.ranking.published_count} on GRE</span>
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

        <div className="gre-section-stack order-2 min-w-0 space-y-5 lg:order-1">
          <PublicationPaperHeader
            title={pub.title}
            greNumber={pub.short_number}
            funder={pub.funder}
            authorByline={authorBylineFromPublication(pub)}
            subVisual={subVisual}
            subCategoryName={pub.subfield_name || pub.sub_category_name}
            publishedLabel={formatPublishedDate(pub.created_at)}
            location={locationLabel || undefined}
            viewsCount={pub.views_count ?? 0}
            downloadsCount={pub.downloads_count ?? 0}
            discussionsCount={pub.discussions_count ?? 0}
            responsesCount={pub.responses_count ?? 0}
            greDoi={pub.gre?.gre_doi}
            accessType={pub.gre?.access_type}
          />

          <PublicationDownloadPanel
            publicationId={pub.id}
            encodedId={pub.encoded_id}
            gre={pub.gre}
            greDoi={pub.gre?.gre_doi}
            greDoiUrl={pub.gre?.gre_doi_url}
            paperNumber={pub.short_number}
            documents={pub.documents}
            isClosed={isClosed}
            publicationTitle={crumbTitle}
            initialLikesCount={pub.likes_count ?? 0}
            initialLikedByMe={pub.liked_by_me ?? false}
            initialShareCount={pub.share_count ?? 0}
          />

          <section className="gre-card min-w-0 overflow-hidden p-6 sm:p-8">
            <h2 className="text-sm font-bold uppercase tracking-wider text-brand-600">Abstract</h2>
            {pub.abstract?.trim() ? (
              <ManuscriptContent value={pub.abstract} className="mt-4 min-w-0" />
            ) : (
              <p className="mt-4 text-base leading-relaxed text-slate-700">No abstract provided.</p>
            )}
            {pub.keywords && pub.keywords.length > 0 && (
              <p className="mt-4 text-sm text-slate-600">
                <span className="font-semibold text-slate-700">Keywords: </span>
                {pub.keywords.join(", ")}
              </p>
            )}
          </section>

          {showManuscriptContent && (
            <>
              {showPdfPreview && docPath && (
              <section className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-7">
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-brand-600">
                      Manuscript PDF
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">Full uploaded paper</p>
                  </div>
                </div>
                <PdfPreview
                  documentPath={docPath}
                  className="min-h-[min(50vh,420px)] rounded-none border-0 sm:min-h-[min(75vh,900px)]"
                />
              </section>
              )}
              {manuscriptSections.length > 0 && (
                <div className="space-y-4">
                  {manuscriptSections.map((section) => (
                    <PublicationManuscriptSection
                      key={section.title}
                      title={section.title}
                      body={section.body}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {(pub.figures?.length ?? 0) > 0 && (
            <PublicationFiguresEditor
              publicationId={pub.id}
              figures={pub.figures ?? []}
              onChange={() => {}}
              readOnly
            />
          )}

          {pub.coordinates && <StudyLocationSection publication={pub} />}
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
      </div>

      {reportOpen && (
        <ReportPlagiarismDialog
          publicationId={pub.id}
          publicationTitle={pub.title}
          onClose={() => setReportOpen(false)}
        />
      )}
    </div>
  );
}
