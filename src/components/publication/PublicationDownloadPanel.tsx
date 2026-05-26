import {
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  MessageSquare,
  Share2,
  ThumbsUp,
  X,
} from "lucide-react";
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
    <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200/80 sm:p-6">
      <h2 className="text-xs font-bold uppercase tracking-widest text-brand-600">Downloads</h2>
      <p className="mt-1 text-sm text-slate-500">
        Download or preview the GRE-formatted publication PDF with header, sections, and research
        team.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleToggleLike}
          disabled={!user || engagementBusy === "like"}
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${
            likedByMe
              ? "bg-brand-50 text-brand-800 ring-brand-200"
              : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
          } ${!user ? "cursor-not-allowed opacity-60" : ""}`}
          title={user ? "Like this paper" : "Sign in to like papers"}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
          {likesCount} like{likesCount === 1 ? "" : "s"}
        </button>
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
          <Share2 className="h-3.5 w-3.5" />
          {shareCount} share{shareCount === 1 ? "" : "s"}
        </span>
        <button
          type="button"
          onClick={() => setActionsOpen(true)}
          className="inline-flex items-center gap-2 px-1 py-1.5 text-xs font-semibold text-brand-700 transition hover:text-brand-800"
        >
          <span className="text-slate-300" aria-hidden>
            |
          </span>
          <Share2 className="h-4 w-4" />
          Share and download
        </button>
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
