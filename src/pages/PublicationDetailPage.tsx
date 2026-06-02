import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { formatGrePaperTitle } from "../lib/grePaperTitle";
import api from "../lib/api";
import { ReportPlagiarismDialog } from "../components/publication/ReportPlagiarismDialog";
import { GreAdPlacement } from "../components/ads/GreAdSlot";
import { RankedNameLabel } from "../components/rankings/RankedNameLabel";
import {
  publicationHasGrePaperBody,
  publicationHasReadablePaper,
  publicationHasUploadedManuscriptPdf,
} from "../lib/publicationReadable";
import { PublicationDiscussions } from "../components/publication/PublicationDiscussions";
import { CoAuthorsPanel } from "../components/publication/CoAuthorsPanel";
import { PublicationDownloadPanel } from "../components/publication/PublicationDownloadPanel";
import { PublicationPaperDocument } from "../components/publication/PublicationPaperDocument";
import { UserAvatar } from "../components/ui/UserAvatar";
import { PublicPageLayout } from "../components/layout/PublicPageLayout";
import { StudyLocationSection } from "../components/map/StudyLocationSection";
import { publicationSubcategoryVisual } from "../lib/taxonomyVisuals";
import { authorBylineFromPublication } from "../lib/publicationAuthors";
import { publicationMapLocationLabel } from "../lib/publicationMapLocation";
import { publicationPublicApiPath } from "../lib/publicationPaths";
import type { Publication } from "../types";

function formatPublishedDate(value?: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
}

export function PublicationDetailPage() {
  const { id } = useParams();
  const [reportOpen, setReportOpen] = useState(false);
  const [paperOpen, setPaperOpen] = useState(false);

  const { data: pub, isLoading, isError } = useQuery({
    queryKey: ["publication", id],
    queryFn: async () => {
      const { data } = await api.get<Publication>(publicationPublicApiPath(id!));
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (pub?.id) {
      api.post("/stats/record/", { publication_id: pub.id, type: "view" }).catch(() => {});
    }
  }, [pub?.id]);

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

  const isClosed = pub.gre?.access_type === "closed";
  const showManuscriptSections = !isClosed && publicationHasGrePaperBody(pub);
  const showUploadedManuscriptPdf = publicationHasUploadedManuscriptPdf(pub);
  const canReadPaper = publicationHasReadablePaper(pub);

  const authorName =
    pub.author?.full_name ||
    `${pub.author?.firstname ?? ""} ${pub.author?.lastname ?? ""}`.trim();
  const subVisual = publicationSubcategoryVisual(pub);
  const locationLabel = publicationMapLocationLabel(pub);
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
      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_280px]">
        <aside className="order-1 space-y-6 lg:order-2">
          <div className="gre-public-card p-5">
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
          <PublicationPaperDocument
            title={pub.title}
            greNumber={pub.short_number}
            funder={pub.funder}
            authorByline={authorBylineFromPublication(pub)}
            subVisual={subVisual}
            subCategoryName={pub.sub_category_name}
            publishedLabel={formatPublishedDate(pub.created_at)}
            location={locationLabel || undefined}
            viewsCount={pub.views_count ?? 0}
            downloadsCount={pub.downloads_count ?? 0}
            discussionsCount={pub.discussions_count ?? 0}
            responsesCount={pub.responses_count ?? 0}
            greDoi={pub.gre?.gre_doi}
            accessType={pub.gre?.access_type}
            authorsComment={isClosed ? pub.gre?.authors_comment : undefined}
            abstract={pub.abstract}
            keywords={pub.keywords}
            showManuscript={showManuscriptSections}
            introduction={pub.introduction}
            methods={pub.methods}
            findings={pub.findings}
            conclusion={pub.conclusion}
            figures={pub.figures ?? []}
            publicationId={pub.id}
            encodedPublicationId={pub.encoded_id}
            references={pub.references}
            collapsibleReading={canReadPaper}
            readingOpen={paperOpen}
            onReadingOpenChange={setPaperOpen}
            canExpandReading={canReadPaper}
            showUploadedManuscriptPdf={showUploadedManuscriptPdf}
          />

          {pub.coordinates && <StudyLocationSection publication={pub} />}

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
            showViewPaperAction={canReadPaper}
            onViewPaper={() => setPaperOpen(true)}
          />

          <CoAuthorsPanel publication={pub} />
          <PublicationDiscussions publicationId={pub.id} coAuthors={pub.co_authors} />

          <section className="gre-public-card border-amber-200 bg-amber-50/40 p-5">
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
    </PublicPageLayout>
  );
}
