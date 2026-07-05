import {
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Share2,
  ThumbsUp,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { greDoiDisplayPath } from "../../lib/publicationGre";
import { grePaperCode } from "../../lib/grePaperTitle";
import api from "../../lib/api";
import { manuscriptPdfUrl, summaryPdfUrl } from "../../lib/publicationGre";
import { PdfPreview } from "./PdfPreview";
import { PublicationPageSection } from "./PublicationPageSection";
import { mediaUrl } from "../../lib/mediaUrl";
import type { GreDocument, PublicationGre } from "../../lib/publicationGre";
import { buildPublicationPath } from "../../lib/publicationPaths";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../ui/ToastProvider";

interface Props {
  publicationId: number;
  gre?: PublicationGre;
  greDoi?: string | null;
  greDoiUrl?: string | null;
  paperNumber?: string | null;
  documents?: GreDocument[];
  isClosed?: boolean;
  publicationTitle?: string;
  encodedId?: string | null;
  initialLikesCount?: number;
  initialLikedByMe?: boolean;
  initialShareCount?: number;
  showViewPaper?: boolean;
  showManuscript?: boolean;
  manuscriptFallbackToSummaryPdf?: boolean;
}

const actionBtn =
  "inline-flex min-h-[2.75rem] w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition";

function DocumentGroup({
  label,
  hint,
  columns = 2,
  children,
}: {
  label: string;
  hint?: string;
  columns?: 1 | 2;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {hint ? <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{hint}</p> : null}
      </div>
      <div
        className={`mt-3 grid gap-2 ${
          columns === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function ShareIconButton({
  label,
  onClick,
  href,
  external,
  disabled,
  active,
  children,
}: {
  label: string;
  onClick?: () => void;
  href?: string;
  external?: boolean;
  disabled?: boolean;
  active?: boolean;
  children: ReactNode;
}) {
  const className = `inline-flex h-10 w-10 items-center justify-center rounded-xl border transition disabled:cursor-not-allowed disabled:opacity-50 ${
    active
      ? "border-brand-200 bg-brand-50 text-brand-700"
      : "border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:text-brand-700"
  }`;

  if (href) {
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        onClick={onClick}
        aria-label={label}
        title={label}
        className={className}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={className}
    >
      {children}
    </button>
  );
}

export function PublicationDownloadPanel({
  publicationId,
  gre,
  greDoi,
  greDoiUrl,
  paperNumber,
  documents = [],
  isClosed,
  publicationTitle,
  encodedId,
  initialLikesCount = 0,
  initialLikedByMe = false,
  initialShareCount = 0,
  showViewPaper = true,
  showManuscript = false,
  manuscriptFallbackToSummaryPdf = true,
}: Props) {
  const { user } = useAuth();
  const toast = useToast();
  const [grePdfOpen, setGrePdfOpen] = useState(false);
  const [manuscriptOpen, setManuscriptOpen] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [likedByMe, setLikedByMe] = useState(initialLikedByMe);
  const [shareCount, setShareCount] = useState(initialShareCount);
  const [engagementBusy, setEngagementBusy] = useState<"like" | "share" | null>(null);

  const manuscript = documents.find((d) => !d.kind || d.kind === "manuscript") ?? documents[0];
  const supplementary = documents.filter((d) => d.kind === "supplementary");
  const uploadedPdfUrl = manuscript?.document ? mediaUrl(manuscript.document) : null;
  const closedAccess = isClosed || gre?.access_type === "closed";
  const doi = greDoi || gre?.gre_doi || null;
  const doiHref = greDoiUrl || gre?.gre_doi_url || (doi ? greDoiDisplayPath(doi) : null);
  const paperCode = grePaperCode(paperNumber ?? null);
  const publicationHref = useMemo(
    () => `${window.location.origin}${buildPublicationPath(publicationId, encodedId)}`,
    [publicationId, encodedId]
  );

  const grePdfPreviewUrl = summaryPdfUrl(publicationId, { inline: true, encodedId });
  const manuscriptPreviewUrl = manuscriptPdfUrl(publicationId, { inline: true, encodedId });
  const manuscriptDownloadUrl = manuscriptPdfUrl(publicationId, { encodedId });
  const summaryFallbackUrl = summaryPdfUrl(publicationId, { inline: true, encodedId });

  useEffect(() => {
    setLikesCount(initialLikesCount);
  }, [initialLikesCount]);

  useEffect(() => {
    setLikedByMe(initialLikedByMe);
  }, [initialLikedByMe]);

  useEffect(() => {
    setShareCount(initialShareCount);
  }, [initialShareCount]);

  const recordDownload = () => {
    api.post("/stats/record/", { publication_id: publicationId, type: "download" }).catch(() => {});
  };

  const recordShare = async (channel: string) => {
    try {
      setEngagementBusy("share");
      const { data } = await api.post<{ share_count?: number }>(
        `/publications/${publicationId}/share/`,
        { channel }
      );
      setShareCount(data.share_count ?? shareCount + 1);
    } catch {
      setShareCount((count) => count + 1);
    } finally {
      setEngagementBusy(null);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicationHref);
    } catch {
      toast.error({
        title: "Could not copy publication link",
        description: "Clipboard access was blocked. Please copy the page URL manually.",
      });
      return;
    }
    toast.success({
      title: "Publication link copied",
      description: "The publication link is ready to paste.",
    });
    void recordShare("copy_link");
  };

  const handleToggleLike = async () => {
    if (!user) return;
    setEngagementBusy("like");
    try {
      const method = likedByMe ? "delete" : "post";
      const { data } = await api.request<{ likes_count?: number; liked?: boolean }>({
        url: `/publications/${publicationId}/like/`,
        method,
      });
      setLikedByMe(Boolean(data.liked));
      setLikesCount(data.likes_count ?? likesCount + (likedByMe ? -1 : 1));
    } finally {
      setEngagementBusy(null);
    }
  };

  const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    publicationHref
  )}`;
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
    `${publicationTitle || "GRE publication"} ${publicationHref}`
  )}`;

  const handleNativeShare = async () => {
    if (!("share" in navigator)) return;
    try {
      await navigator.share({
        title: publicationTitle || "GRE publication",
        url: publicationHref,
      });
      void recordShare("native_share");
    } catch {
      /* user cancelled */
    }
  };

  const accessMeta = [doi, paperCode ? `Publication ${paperCode}` : null].filter(Boolean).join(" · ");

  return (
    <PublicationPageSection
      id="publication-access"
      title="Downloads & sharing"
      description={
        accessMeta ? (
          <>
            {doi && doiHref ? (
              <a
                href={doiHref}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand-600 hover:underline"
              >
                {doi}
              </a>
            ) : null}
            {doi && paperCode ? " · " : null}
            {paperCode ? <span>Publication {paperCode}</span> : null}
          </>
        ) : (
          "Download PDFs or share this publication with colleagues."
        )
      }
    >
      <div className="space-y-3">
        <DocumentGroup
          label="GRE publication PDF"
          hint={
            closedAccess
              ? "Open-access summary formatted for GRE."
              : "Formatted GRE version of this study."
          }
          columns={showViewPaper ? 2 : 1}
        >
          <a
            href={
              closedAccess
                ? summaryPdfUrl(publicationId, { discussions: true, encodedId })
                : summaryPdfUrl(publicationId, { encodedId })
            }
            onClick={() => recordDownload()}
            className={`${actionBtn} bg-brand-600 text-white shadow-sm shadow-brand-600/15 hover:bg-brand-700`}
          >
            <Download className="h-4 w-4 shrink-0" aria-hidden />
            Download
          </a>
          {showViewPaper ? (
            <button
              type="button"
              onClick={() => setGrePdfOpen((open) => !open)}
              className={`${actionBtn} border ${
                grePdfOpen
                  ? "border-brand-300 bg-brand-50 text-brand-800"
                  : "border-slate-200 bg-white text-slate-700 hover:border-brand-200"
              }`}
              aria-expanded={grePdfOpen}
            >
              {grePdfOpen ? (
                <EyeOff className="h-4 w-4 shrink-0" aria-hidden />
              ) : (
                <Eye className="h-4 w-4 shrink-0" aria-hidden />
              )}
              {grePdfOpen ? "Hide preview" : "View preview"}
            </button>
          ) : null}
        </DocumentGroup>

        {showManuscript ? (
          <DocumentGroup
            label="Uploaded manuscript"
            hint="Original PDF as submitted by the author."
          >
            <a
              href={manuscriptDownloadUrl}
              onClick={() => recordDownload()}
              className={`${actionBtn} border border-slate-200 bg-white text-slate-700 hover:border-brand-200 hover:text-brand-800`}
            >
              <Download className="h-4 w-4 shrink-0" aria-hidden />
              Download
            </a>
            <button
              type="button"
              onClick={() => setManuscriptOpen((open) => !open)}
              className={`${actionBtn} border ${
                manuscriptOpen
                  ? "border-brand-300 bg-brand-50 text-brand-800"
                  : "border-slate-200 bg-white text-slate-700 hover:border-brand-200"
              }`}
              aria-expanded={manuscriptOpen}
            >
              {manuscriptOpen ? (
                <EyeOff className="h-4 w-4 shrink-0" aria-hidden />
              ) : (
                <Eye className="h-4 w-4 shrink-0" aria-hidden />
              )}
              {manuscriptOpen ? "Hide preview" : "View preview"}
            </button>
          </DocumentGroup>
        ) : null}

        {!closedAccess && uploadedPdfUrl && !showManuscript ? (
          <DocumentGroup label="Uploaded PDF" hint="Author-uploaded file." columns={1}>
            <a
              href={uploadedPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => recordDownload()}
              className={`${actionBtn} border border-slate-200 bg-white text-slate-700 hover:border-brand-200 hover:text-brand-800`}
            >
              <Download className="h-4 w-4 shrink-0" aria-hidden />
              Download uploaded PDF
            </a>
          </DocumentGroup>
        ) : null}

        {supplementary.length > 0 ? (
          <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-3">
            <p className="text-sm font-semibold text-slate-800">Supplementary files</p>
            <ul className="mt-2 space-y-1.5">
              {supplementary.map((doc) => {
                const href = doc.document.startsWith("http")
                  ? doc.document
                  : mediaUrl(doc.document);
                if (!href) return null;
                return (
                  <li key={doc.id}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => recordDownload()}
                      className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:underline"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {doc.label || "Supplementary file"}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {gre?.external_url ? (
          <p className="text-sm text-slate-600">
            <span className="font-medium text-slate-700">Publisher: </span>
            <a
              href={gre.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline"
            >
              {closedAccess ? "Request access" : "External publication"}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </p>
        ) : null}
      </div>

      <div className="mt-5 rounded-xl border border-slate-200/80 bg-white p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800">Share this publication</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {likesCount > 0 || shareCount > 0
                ? [
                    likesCount > 0 ? `${likesCount} like${likesCount === 1 ? "" : "s"}` : null,
                    shareCount > 0 ? `${shareCount} share${shareCount === 1 ? "" : "s"}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : "Copy the link or share on social media."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {user ? (
              <button
                type="button"
                disabled={engagementBusy === "like"}
                onClick={() => void handleToggleLike()}
                className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition disabled:opacity-50 ${
                  likedByMe
                    ? "border-brand-200 bg-brand-50 text-brand-800"
                    : "border-slate-200 bg-white text-slate-700 hover:border-brand-200"
                }`}
              >
                <ThumbsUp className="h-4 w-4" />
                {likedByMe ? "Liked" : "Like"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void handleCopyLink()}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-800"
            >
              <Copy className="h-4 w-4" />
              Copy link
            </button>
            <div className="flex items-center gap-1.5">
              <ShareIconButton
                label="Share on LinkedIn"
                href={linkedInShareUrl}
                external
                onClick={() => void recordShare("linkedin")}
              >
                <Share2 className="h-4 w-4" />
              </ShareIconButton>
              <ShareIconButton
                label="Share on WhatsApp"
                href={whatsappShareUrl}
                external
                onClick={() => void recordShare("whatsapp")}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.75.75 0 0 0 .917.917l4.458-1.495A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.006-1.367l-.357-.212-2.647.888.888-2.647-.212-.357A9.818 9.818 0 1 1 12 21.818z" />
                </svg>
              </ShareIconButton>
              {"share" in navigator ? (
                <ShareIconButton
                  label="System share"
                  disabled={engagementBusy === "share"}
                  onClick={() => void handleNativeShare()}
                >
                  <Share2 className="h-4 w-4" />
                </ShareIconButton>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {showViewPaper && grePdfOpen ? (
        <div className="mt-5 space-y-2">
          <PdfPreview
            previewUrl={grePdfPreviewUrl}
            title={publicationTitle ? `${publicationTitle} · GRE PDF` : "GRE publication PDF"}
            emptyState="publication"
            layout="page"
            className="w-full"
          />
        </div>
      ) : null}

      {showManuscript && manuscriptOpen ? (
        <div className="mt-5 space-y-2">
          <PdfPreview
            previewUrl={manuscriptPreviewUrl}
            fallbackPreviewUrl={
              manuscriptFallbackToSummaryPdf ? summaryFallbackUrl : null
            }
            title={publicationTitle ? `${publicationTitle} · Manuscript` : "Uploaded manuscript"}
            emptyState="publication"
            layout="page"
            className="min-h-[min(50vh,420px)] sm:min-h-[min(70vh,720px)]"
          />
        </div>
      ) : null}
    </PublicationPageSection>
  );
}
