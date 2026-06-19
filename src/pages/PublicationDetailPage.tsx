import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { formatGrePaperTitle } from "../lib/grePaperTitle";
import api from "../lib/api";
import { ReportPlagiarismDialog } from "../components/publication/ReportPlagiarismDialog";
import { PublicationViewShell } from "../components/publication/PublicationViewShell";
import {
  publicationHasGrePaperBody,
  publicationHasReadablePaper,
  publicationHasUploadedManuscriptPdf,
  publicationHasViewablePdf,
} from "../lib/publicationReadable";
import { PublicationManuscriptPdfSection } from "../components/publication/PublicationManuscriptPdfSection";
import { PublicationDiscussions } from "../components/publication/PublicationDiscussions";
import { CoAuthorsPanel } from "../components/publication/CoAuthorsPanel";
import { PublicationDownloadPanel } from "../components/publication/PublicationDownloadPanel";
import { PublicationResearchIntegritySection } from "../components/publication/PublicationResearchIntegritySection";
import { PublicationPaperDocument } from "../components/publication/PublicationPaperDocument";
import { PublicPageLayout } from "../components/layout/PublicPageLayout";
import { StudyLocationSection } from "../components/map/StudyLocationSection";
import { publicationSubcategoryVisual } from "../lib/taxonomyVisuals";
import {
  authorBylineFromPublication,
  publicationCoAuthorsFromPublication,
} from "../lib/publicationAuthors";
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
  const showManuscriptInPaper = publicationHasReadablePaper(pub);
  const showViewPaperPdf = publicationHasViewablePdf(pub);
  const showUploadedManuscriptPdf = publicationHasUploadedManuscriptPdf(pub);

  const subVisual = publicationSubcategoryVisual(pub);
  const locationLabel = publicationMapLocationLabel(pub);
  const headerLocation = pub.coordinates ? undefined : locationLabel || undefined;
  const adContext = {
    categoryId: pub.category_id ?? undefined,
    subCategoryId: pub.sub_category_id ?? undefined,
    location: pub.coordinates?.location || locationLabel || undefined,
    affiliation: pub.author?.affiliation || pub.coordinates?.institution || undefined,
    title: pub.title,
  };
  const crumbTitle = formatGrePaperTitle(pub.title, pub.short_number);

  return (
    <PublicPageLayout
      wide
      compactHero
      hideMobileHero
      accent="blue"
      title="Publication"
      crumbs={[
        { label: "Home", to: "/" },
        {
          label: crumbTitle.slice(0, 48) + (crumbTitle.length > 48 ? "…" : ""),
        },
      ]}
      back={{ to: "/", label: "Back to map" }}
    >
      <PublicationViewShell
        publication={pub}
        adContext={adContext}
        publicationTitle={crumbTitle}
      >
          <PublicationPaperDocument
            title={pub.title}
            greNumber={pub.short_number}
            funder={pub.funder}
            authorByline={authorBylineFromPublication(pub)}
            subVisual={subVisual}
            subCategoryName={pub.sub_category_name}
            publishedLabel={formatPublishedDate(pub.created_at)}
            location={headerLocation}
            viewsCount={pub.views_count ?? 0}
            downloadsCount={pub.downloads_count ?? 0}
            discussionsCount={pub.discussions_count ?? 0}
            responsesCount={pub.responses_count ?? 0}
            greDoi={pub.gre?.gre_doi}
            accessType={pub.gre?.access_type}
            authorsComment={isClosed ? pub.gre?.authors_comment : undefined}
            includeManuscript={showManuscriptInPaper}
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
            showViewPaper={showViewPaperPdf}
          />

          <PublicationManuscriptPdfSection
            publicationId={pub.id}
            encodedId={pub.encoded_id}
            show={showUploadedManuscriptPdf}
            fallbackToSummaryPdf={false}
          />

          <CoAuthorsPanel publication={pub} />
          <PublicationDiscussions
            publicationId={pub.id}
            coAuthors={pub.co_authors ?? publicationCoAuthorsFromPublication(pub)}
            authorUserId={pub.author?.id}
          />

          <PublicationResearchIntegritySection onReport={() => setReportOpen(true)} />
      </PublicationViewShell>

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
