import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  FileText,
  MapPin,
  MessageSquareWarning,
} from "lucide-react";
import { useMemo, useState } from "react";
import { StatusBadge } from "../dashboard/StatusBadge";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Textarea";
import { formatGrePaperTitle } from "../../lib/grePaperTitle";
import api from "../../lib/api";
import { abstractPlainText } from "../../lib/abstractText";
import { authorBylineFromPublication } from "../../lib/publicationAuthors";
import { reviewManuscriptPdfUrl } from "../../lib/publicationGre";
import { authorDisplayName } from "../../lib/userDisplay";
import { PublicationAuthorByline } from "./PublicationAuthorByline";
import { PublicationManuscriptSection } from "./PublicationManuscriptSection";
import { publicationSubcategoryVisual } from "../../lib/taxonomyVisuals";
import { SubcategoryBadge } from "../taxonomy/SubcategoryBadge";
import type { Publication } from "../../types";
import { PdfPreview } from "./PdfPreview";

interface Props {
  pub: Publication;
  compact?: boolean;
  onReviewed?: () => void;
}

function AccessTypePill({ accessType }: { accessType?: "open" | "closed" }) {
  const open = accessType !== "closed";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${
        open
          ? "bg-brand-50 text-brand-800 ring-brand-200"
          : "bg-slate-100 text-slate-700 ring-slate-200"
      }`}
    >
      {open ? "Open access" : "Restricted access"}
    </span>
  );
}

function hasManuscriptSections(pub: Publication) {
  return Boolean(
    pub.introduction?.trim() ||
      pub.methods?.trim() ||
      pub.results?.trim() ||
      pub.findings?.trim() ||
      pub.conclusion?.trim()
  );
}

export function AdminPublicationReviewCard({ pub, compact, onReviewed }: Props) {
  const queryClient = useQueryClient();
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState("");

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["publication-review", pub.id],
    queryFn: async () => {
      const { data } = await api.get<Publication>(`/publications/${pub.id}/`);
      return data;
    },
  });

  const reviewPub = detail ?? pub;
  const author = authorDisplayName(reviewPub.author);
  const authorByline = authorBylineFromPublication(reviewPub);
  const subVisual = publicationSubcategoryVisual(reviewPub);
  const accessType = reviewPub.gre?.access_type ?? "open";
  const manuscriptPreviewUrl = reviewManuscriptPdfUrl(reviewPub.id, true);
  const abstract = abstractPlainText(reviewPub.abstract);
  const keywords = useMemo(() => {
    const raw = reviewPub.keywords;
    if (!raw?.length) return [];
    return raw.map((k) => k.trim()).filter(Boolean);
  }, [reviewPub.keywords]);

  const acceptMutation = useMutation({
    mutationFn: () => api.post(`/publications/${pub.id}/accept/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-review"] });
      queryClient.invalidateQueries({ queryKey: ["publications"] });
      queryClient.invalidateQueries({ queryKey: ["publication-review", pub.id] });
      queryClient.invalidateQueries({ queryKey: ["publication-edit", String(pub.id)] });
      onReviewed?.();
    },
  });

  const commentMutation = useMutation({
    mutationFn: (comment: string) =>
      api.post(`/publications/${pub.id}/admin_comment/`, { comment }),
    onSuccess: () => {
      setCommentOpen(false);
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["admin-review"] });
      queryClient.invalidateQueries({ queryKey: ["publication-review", pub.id] });
      queryClient.invalidateQueries({ queryKey: ["publication-edit", String(pub.id)] });
      onReviewed?.();
    },
  });

  const showSections = hasManuscriptSections(reviewPub);
  const externalUrl = reviewPub.gre?.external_url?.trim();
  const referenceUrl = reviewPub.gre?.reference_url?.trim();

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-gradient-to-r from-brand-50/50 via-white to-teal-50/30 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">
              Submission for review
            </p>
            <h3 className="mt-1 text-lg font-bold leading-snug text-ink sm:text-xl">
              {formatGrePaperTitle(reviewPub.title, reviewPub.short_number)}
            </h3>
            {authorByline.authors.length > 0 ? (
              <PublicationAuthorByline byline={authorByline} className="mt-2" />
            ) : (
              <p className="mt-1.5 text-sm font-medium text-slate-600">{author}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {subVisual && <SubcategoryBadge visual={subVisual} size="sm" />}
              <AccessTypePill accessType={accessType} />
            </div>
          </div>
          <StatusBadge status={reviewPub.status} />
        </div>
      </div>

      {detailLoading && (
        <p className="border-b border-slate-100 px-4 py-3 text-sm text-slate-500 sm:px-5">
          Loading full manuscript…
        </p>
      )}

      <div
        className={`grid gap-0 ${compact ? "" : "lg:grid-cols-[minmax(0,1fr)_minmax(18rem,42%)]"}`}
      >
        <div className="min-w-0 space-y-0 lg:border-r lg:border-slate-100">
          <div className="space-y-4 border-b border-slate-100 p-4 sm:p-5">
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Abstract
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                {abstract || "No abstract provided."}
              </p>
            </div>

            {keywords.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Keywords
                </h4>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {keywords.map((kw) => (
                    <span
                      key={kw}
                      className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {reviewPub.funder?.trim() && (
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Funder
                </h4>
                <p className="mt-1 text-sm text-slate-700">{reviewPub.funder.trim()}</p>
              </div>
            )}

            {reviewPub.coordinates && (
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Study location
                </h4>
                <p className="mt-1 flex items-start gap-1.5 text-sm text-slate-700">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                  <span>
                    {reviewPub.coordinates.location}
                    {reviewPub.coordinates.institution &&
                      ` · ${reviewPub.coordinates.institution}`}
                  </span>
                </p>
              </div>
            )}

            {(externalUrl || referenceUrl) && (
              <div className="space-y-2 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 text-sm">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Publisher links
                </p>
                {externalUrl && (
                  <a
                    href={externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 font-medium text-brand-700 hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    External publication URL
                  </a>
                )}
                {referenceUrl && (
                  <a
                    href={referenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 font-medium text-brand-700 hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Reference / DOI link
                  </a>
                )}
              </div>
            )}
          </div>

          {showSections && (
            <div className="space-y-3 p-4 sm:p-5">
              <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Manuscript sections
              </h4>
              <PublicationManuscriptSection title="Introduction" body={reviewPub.introduction} />
              <PublicationManuscriptSection title="Methods" body={reviewPub.methods} />
              <PublicationManuscriptSection title="Results" body={reviewPub.results} />
              <PublicationManuscriptSection
                title="Findings — discussion"
                body={reviewPub.findings}
              />
              <PublicationManuscriptSection title="Conclusion" body={reviewPub.conclusion} />
            </div>
          )}

          {reviewPub.references?.trim() && (
            <div className="border-t border-slate-100 p-4 sm:p-5">
              <PublicationManuscriptSection title="References" body={reviewPub.references} />
            </div>
          )}

          {accessType === "closed" && reviewPub.gre?.author_summary?.trim() && (
            <div className="border-t border-slate-100 p-4 sm:p-5">
              <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Author summary (restricted)
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                {reviewPub.gre.author_summary.trim()}
              </p>
            </div>
          )}
        </div>

        {!compact && (
          <div className="flex min-h-0 flex-col bg-slate-50/40 p-4 sm:p-5 lg:min-h-[min(420px,50vh)]">
            <div className="mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand-600" />
              <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Manuscript preview
              </h4>
            </div>
            <p className="mb-3 text-xs leading-relaxed text-slate-500">
              {accessType === "closed"
                ? "Restricted papers show the GRE summary PDF when no upload is available. Open-access papers use the uploaded PDF."
                : "Uploaded PDF for this submission."}
            </p>
            <PdfPreview
              previewUrl={manuscriptPreviewUrl}
              title={formatGrePaperTitle(reviewPub.title, reviewPub.short_number)}
              emptyState="publication"
              className="min-h-[min(360px,45vh)] flex-1"
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-5">
        <Button
          type="button"
          onClick={() => acceptMutation.mutate()}
          disabled={acceptMutation.isPending}
        >
          <CheckCircle2 className="h-4 w-4" />
          Approve & publish
        </Button>
        <Button type="button" variant="secondary" onClick={() => setCommentOpen((v) => !v)}>
          <MessageSquareWarning className="h-4 w-4" />
          Request revision
        </Button>
        <p className="w-full text-xs text-slate-500 sm:ml-auto sm:w-auto sm:self-center">
          Only the author can edit this submission from their dashboard.
        </p>
      </div>

      {commentOpen && (
        <form
          className="border-t border-amber-200 bg-amber-50/50 px-4 py-4 sm:px-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (commentText.trim()) commentMutation.mutate(commentText.trim());
          }}
        >
          <p className="flex items-center gap-2 text-sm font-medium text-amber-900">
            <AlertCircle className="h-4 w-4" />
            Revision notes for the author
          </p>
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={4}
            className="mt-3"
            placeholder="Explain what should be updated…"
            required
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="submit" loading={commentMutation.isPending}>
              Send revision request
            </Button>
            <Button type="button" variant="ghost" onClick={() => setCommentOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </article>
  );
}
