import {
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Link2,
  MessageSquare,
  Share2,
  ThumbsUp,
  X,
} from "lucide-react";
import { greDoiDisplayPath } from "../../lib/publicationGre";
import { grePaperCode } from "../../lib/grePaperTitle";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import api from "../../lib/api";
import { summaryPdfUrl } from "../../lib/publicationGre";
import { mediaUrl } from "../../lib/mediaUrl";
import type { GreDocument, PublicationGre } from "../../lib/publicationGre";
import { buildPublicationPath } from "../../lib/publicationPaths";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../ui/ToastProvider";
import { PdfPreview } from "./PdfPreview";

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
}: Props) {
  const { user } = useAuth();
  const toast = useToast();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDiscussions, setPreviewDiscussions] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [likedByMe, setLikedByMe] = useState(initialLikedByMe);
  const [shareCount, setShareCount] = useState(initialShareCount);
  const [engagementBusy, setEngagementBusy] = useState<"like" | "share" | null>(null);

  const manuscript = documents.find((d) => !d.kind || d.kind === "manuscript") ?? documents[0];
  const supplementary = documents.filter((d) => d.kind === "supplementary");
  const fullUrl = manuscript?.document ? mediaUrl(manuscript.document) : null;
  const closedAccess = isClosed || gre?.access_type === "closed";
  const doi = greDoi || gre?.gre_doi || null;
  const doiHref = greDoiUrl || gre?.gre_doi_url || (doi ? greDoiDisplayPath(doi) : null);
  const paperCode = grePaperCode(paperNumber ?? null);
  const publicationHref = useMemo(
    () => `${window.location.origin}${buildPublicationPath(publicationId, encodedId)}`,
    [publicationId, encodedId]
  );

  const grePdfPreviewUrl = summaryPdfUrl(publicationId, {
    discussions: previewDiscussions,
    inline: true,
  });

  useEffect(() => {
    setLikesCount(initialLikesCount);
  }, [initialLikesCount]);

  useEffect(() => {
    setLikedByMe(initialLikedByMe);
  }, [initialLikedByMe]);

  useEffect(() => {
    setShareCount(initialShareCount);
  }, [initialShareCount]);

  useEffect(() => {
    if (!actionsOpen) return;
    const previousOverflow = document.body.style.overflow;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActionsOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [actionsOpen]);

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
        title: "Could not copy paper link",
        description: "Clipboard access was blocked. Please copy the page URL manually.",
      });
      return;
    }
    toast.success({
      title: "Paper link copied",
      description: "The publication link is ready to paste.",
    });
    setActionsOpen(false);
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
      setActionsOpen(false);
      void recordShare("native_share");
    } catch {
      /* user cancelled */
    }
  };

  const actionButtonClass =
    "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50";

  const inlineActionClass =
    "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800";

  const inlinePrimaryClass =
    "inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700";

  const inlinePillClass =
    "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800";

  const actionsDialog =
    actionsOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[2600] flex items-end justify-center bg-slate-900/50 p-4 sm:items-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="publication-actions-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) setActionsOpen(false);
            }}
          >
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
                <div>
                  <h3 id="publication-actions-title" className="text-lg font-semibold text-ink">
                    Share and download
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Preview the GRE PDF, download files, and share this publication.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActionsOpen(false)}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-ink"
                  aria-label="Close actions"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[75vh] space-y-3 overflow-y-auto px-5 py-5">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewOpen((open) => !open);
                    setActionsOpen(false);
                  }}
                  className={`${actionButtonClass} ${
                    previewOpen ? "border-brand-300 bg-brand-50 text-brand-800" : ""
                  }`}
                >
                  {previewOpen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {previewOpen ? "Hide preview" : "Preview PDF"}
                </button>

                <a
                  href={summaryPdfUrl(publicationId)}
                  onClick={() => {
                    recordDownload();
                    setActionsOpen(false);
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  <FileText className="h-4 w-4" />
                  GRE publication PDF
                </a>

                {!closedAccess && fullUrl && (
                  <a
                    href={fullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      recordDownload();
                      setActionsOpen(false);
                    }}
                    className={`${actionButtonClass} border-brand-200 bg-brand-50 text-brand-800 hover:bg-brand-100`}
                  >
                    <Download className="h-4 w-4" />
                    Full paper (uploaded PDF)
                  </a>
                )}

                {closedAccess && (
                  <a
                    href={summaryPdfUrl(publicationId, { discussions: true })}
                    onClick={() => {
                      recordDownload();
                      setActionsOpen(false);
                    }}
                    className={actionButtonClass}
                  >
                    <MessageSquare className="h-4 w-4" />
                    GRE PDF + discussions
                  </a>
                )}

                {gre?.external_url && (
                  <a
                    href={gre.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setActionsOpen(false)}
                    className={actionButtonClass}
                  >
                    <ExternalLink className="h-4 w-4" />
                    {closedAccess ? "Publisher access" : "External publication"}
                  </a>
                )}

                <button type="button" onClick={handleCopyLink} className={actionButtonClass}>
                  <Copy className="h-4 w-4" />
                  Copy paper link
                </button>

                <a
                  href={linkedInShareUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => {
                    void recordShare("linkedin");
                    setActionsOpen(false);
                  }}
                  className={actionButtonClass}
                >
                  <Share2 className="h-4 w-4" />
                  LinkedIn
                </a>

                <a
                  href={whatsappShareUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => {
                    void recordShare("whatsapp");
                    setActionsOpen(false);
                  }}
                  className={actionButtonClass}
                >
                  <Share2 className="h-4 w-4" />
                  WhatsApp
                </a>

                {"share" in navigator && (
                  <button type="button" onClick={handleNativeShare} className={actionButtonClass}>
                    <Share2 className="h-4 w-4" />
                    Share
                  </button>
                )}

                {supplementary.map((doc) => {
                  const href = doc.document.startsWith("http") ? doc.document : mediaUrl(doc.document);
                  if (!href) return null;
                  return (
                    <a
                      key={doc.id}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        recordDownload();
                        setActionsOpen(false);
                      }}
                      className={actionButtonClass}
                    >
                      <Download className="h-4 w-4" />
                      {doc.label || "Supplementary file"}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <section className="gre-card min-w-0 overflow-hidden p-5 sm:p-6">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-600">
            Publication access
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            GRE identifier, downloads, preview, and sharing for this paper.
          </p>
        </div>
        {doi && doiHref && (
          <a
            href={doiHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full shrink-0 items-start gap-2.5 rounded-2xl bg-slate-900 px-3.5 py-2.5 text-white shadow-sm transition hover:bg-slate-800"
          >
            <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
            <span className="min-w-0 text-left text-xs leading-relaxed">
              <span className="block font-semibold">DOI: {doi}</span>
              {paperCode && (
                <span className="mt-0.5 block text-[10px] font-medium tracking-wide text-slate-400">
                  Paper {paperCode}
                </span>
              )}
            </span>
          </a>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3 sm:p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <a
              href={summaryPdfUrl(publicationId)}
              onClick={() => recordDownload()}
              className={`${inlinePrimaryClass} w-full sm:w-auto`}
            >
              <Download className="h-4 w-4 shrink-0" />
              Download GRE PDF
            </a>
            <button
              type="button"
              onClick={() => setPreviewOpen((open) => !open)}
              className={`${inlineActionClass} w-full sm:w-auto ${
                previewOpen ? "border-brand-300 bg-brand-50 text-brand-800" : ""
              }`}
            >
              {previewOpen ? <EyeOff className="h-4 w-4 shrink-0" /> : <Eye className="h-4 w-4 shrink-0" />}
              {previewOpen ? "Hide preview" : "Preview GRE PDF"}
            </button>
            <button
              type="button"
              onClick={() => setActionsOpen(true)}
              className={`${inlineActionClass} w-full sm:ml-auto sm:w-auto`}
            >
              <Share2 className="h-4 w-4 shrink-0" />
              More options
            </button>
          </div>

          {(!closedAccess && fullUrl) || closedAccess || gre?.external_url ? (
            <div className="mt-2 flex flex-wrap gap-2 border-t border-slate-200 pt-2.5">
              {!closedAccess && fullUrl && (
                <a
                  href={fullUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => recordDownload()}
                  className={inlinePillClass}
                >
                  <FileText className="h-4 w-4 shrink-0" />
                  Full paper PDF
                </a>
              )}
              {closedAccess && (
                <a
                  href={summaryPdfUrl(publicationId, { discussions: true })}
                  onClick={() => recordDownload()}
                  className={inlinePillClass}
                >
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  PDF + discussions
                </a>
              )}
              {gre?.external_url && (
                <a
                  href={gre.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={inlinePillClass}
                >
                  <ExternalLink className="h-4 w-4 shrink-0" />
                  {closedAccess ? "Publisher access" : "External link"}
                </a>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-1">
          <button
            type="button"
            onClick={handleToggleLike}
            disabled={!user || engagementBusy === "like"}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ring-1 transition ${
              likedByMe
                ? "bg-brand-50 text-brand-800 ring-brand-200"
                : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
            } ${!user ? "cursor-not-allowed opacity-60" : ""}`}
            title={user ? "Like this paper" : "Sign in to like papers"}
          >
            <ThumbsUp className="h-4 w-4" />
            {likesCount} like{likesCount === 1 ? "" : "s"}
          </button>
          <button
            type="button"
            onClick={() => void handleCopyLink()}
            disabled={engagementBusy === "share"}
            className={inlinePillClass}
          >
            <Copy className="h-4 w-4 shrink-0" />
            Copy link
          </button>
          {"share" in navigator && (
            <button
              type="button"
              onClick={() => void handleNativeShare()}
              disabled={engagementBusy === "share"}
              className={inlinePillClass}
            >
              <Share2 className="h-4 w-4 shrink-0" />
              Share
            </button>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-500 ring-1 ring-slate-100">
            <Share2 className="h-3.5 w-3.5" />
            {shareCount} share{shareCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {previewOpen && (
        <div className="mt-5 space-y-3">
          {closedAccess && (
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={previewDiscussions}
                onChange={(e) => setPreviewDiscussions(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Include discussion highlights in preview
            </label>
          )}
          <PdfPreview
            previewUrl={grePdfPreviewUrl}
            title={publicationTitle ? `${publicationTitle} · GRE PDF` : "GRE publication PDF"}
            emptyState="publication"
            className="min-h-[min(70vh,820px)]"
          />
        </div>
      )}
      {actionsDialog}
    </section>
  );
}
