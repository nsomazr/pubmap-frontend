import {
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Link2,
  MessageSquare,
  MoreHorizontal,
  Share2,
  ThumbsUp,
} from "lucide-react";
import { greDoiDisplayPath } from "../../lib/publicationGre";
import { grePaperCode } from "../../lib/grePaperTitle";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import api from "../../lib/api";
import { summaryPdfUrl } from "../../lib/publicationGre";
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
  /** Opens the on-page GRE paper reader (replaces inline GRE PDF preview). */
  onViewPaper?: () => void;
  showViewPaperAction?: boolean;
}

function MenuSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="py-1">
      <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function MenuItem({
  children,
  onClick,
  href,
  external,
  icon: Icon,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  external?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const className =
    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-brand-50 hover:text-brand-800";

  const inner = (
    <>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        onClick={onClick}
        className={className}
      >
        {inner}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {inner}
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
  onViewPaper,
  showViewPaperAction = false,
}: Props) {
  const { user } = useAuth();
  const toast = useToast();
  const menuWrapRef = useRef<HTMLDivElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const [menuRect, setMenuRect] = useState<{
    left: number;
    top: number;
    width: number;
    openUp: boolean;
  } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
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

  const menuExtraCount = useMemo(() => {
    let n = 0;
    if (!closedAccess && fullUrl) n += 1;
    if (closedAccess) n += 1;
    if (gre?.external_url) n += 1;
    n += supplementary.length;
    n += 3; // copy, linkedin, whatsapp baseline share options
    if ("share" in navigator) n += 1;
    return n;
  }, [closedAccess, fullUrl, gre?.external_url, supplementary.length]);

  useEffect(() => {
    setLikesCount(initialLikesCount);
  }, [initialLikesCount]);

  useEffect(() => {
    setLikedByMe(initialLikedByMe);
  }, [initialLikedByMe]);

  useEffect(() => {
    setShareCount(initialShareCount);
  }, [initialShareCount]);

  const updateMenuRect = useCallback(() => {
    const trigger = menuTriggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const gap = 8;
    const width = Math.min(288, window.innerWidth - 16);
    const left = Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8));
    const panelHeight = menuPanelRef.current?.offsetHeight ?? 280;
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const openUp = spaceBelow < panelHeight && spaceAbove > spaceBelow;
    setMenuRect({
      left,
      top: openUp ? rect.top - gap : rect.bottom + gap,
      width,
      openUp,
    });
  }, []);

  useLayoutEffect(() => {
    if (!menuOpen) {
      setMenuRect(null);
      return;
    }
    updateMenuRect();
    const raf = requestAnimationFrame(() => updateMenuRect());
    window.addEventListener("resize", updateMenuRect);
    window.addEventListener("scroll", updateMenuRect, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", updateMenuRect);
      window.removeEventListener("scroll", updateMenuRect, true);
    };
  }, [menuOpen, updateMenuRect]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuWrapRef.current?.contains(target) ||
        menuPanelRef.current?.contains(target)
      ) {
        return;
      }
      setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

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
    setMenuOpen(false);
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
      setMenuOpen(false);
      void recordShare("native_share");
    } catch {
      /* user cancelled */
    }
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <section className="gre-public-card min-w-0 overflow-visible p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-600">
            Publication access
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-500">
            Download, preview, and share this paper on GRE.
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
                  Paper ID {paperCode}
                </span>
              )}
            </span>
          </a>
        )}
      </div>

      <div className="mt-5 overflow-visible rounded-2xl bg-gradient-to-br from-slate-50 via-white to-brand-50/40 p-4 ring-1 ring-slate-200/80 sm:p-5">
        <div className="grid gap-3 overflow-visible sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] sm:items-stretch">
          <a
            href={summaryPdfUrl(publicationId)}
            onClick={() => recordDownload()}
            className="inline-flex min-h-[3rem] items-center justify-center gap-2.5 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700"
          >
            <Download className="h-4 w-4 shrink-0" />
            Download GRE PDF
          </a>

          {showViewPaperAction && onViewPaper ? (
            <button
              type="button"
              onClick={() => {
                onViewPaper();
                document.getElementById("publication-paper")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
              className="inline-flex min-h-[3rem] items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:bg-white"
            >
              <Eye className="h-4 w-4 shrink-0" />
              View paper
            </button>
          ) : (
            <span className="hidden min-h-[3rem] sm:block" aria-hidden />
          )}

          <div ref={menuWrapRef} className="relative z-20 sm:self-stretch">
            <button
              ref={menuTriggerRef}
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className={`inline-flex h-full min-h-[3rem] w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition sm:min-w-[8.5rem] ${
                menuOpen
                  ? "border-brand-300 bg-brand-50 text-brand-800 ring-2 ring-brand-100"
                  : "border-slate-200 bg-white text-slate-700 hover:border-brand-200 hover:bg-white"
              }`}
            >
              <MoreHorizontal className="h-4 w-4 shrink-0" />
              <span className="sm:hidden">More</span>
              <span className="hidden sm:inline">More options</span>
              {menuExtraCount > 0 && (
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                  {menuExtraCount}
                </span>
              )}
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-slate-400 transition ${menuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {menuOpen &&
              typeof document !== "undefined" &&
              createPortal(
                <div
                  ref={menuPanelRef}
                  role="menu"
                  className="fixed z-[10000] max-h-[min(70vh,24rem)] overflow-y-auto overscroll-contain rounded-2xl border border-slate-200/90 bg-white py-2 shadow-xl shadow-slate-900/15 ring-1 ring-slate-100"
                  style={
                    menuRect
                      ? {
                          left: menuRect.left,
                          top: menuRect.top,
                          width: menuRect.width,
                          transform: menuRect.openUp ? "translateY(-100%)" : undefined,
                        }
                      : { visibility: "hidden", left: 0, top: 0, width: 288 }
                  }
                >
                <MenuSection title="Documents">
                  <MenuItem
                    icon={FileText}
                    href={summaryPdfUrl(publicationId)}
                    onClick={() => {
                      recordDownload();
                      closeMenu();
                    }}
                  >
                    GRE publication PDF
                  </MenuItem>
                  {!closedAccess && fullUrl && (
                    <MenuItem
                      icon={Download}
                      href={fullUrl}
                      external
                      onClick={() => {
                        recordDownload();
                        closeMenu();
                      }}
                    >
                      Full paper (uploaded PDF)
                    </MenuItem>
                  )}
                  {closedAccess && (
                    <MenuItem
                      icon={MessageSquare}
                      href={summaryPdfUrl(publicationId, { discussions: true })}
                      onClick={() => {
                        recordDownload();
                        closeMenu();
                      }}
                    >
                      GRE PDF + discussions
                    </MenuItem>
                  )}
                  {supplementary.map((doc) => {
                    const href = doc.document.startsWith("http")
                      ? doc.document
                      : mediaUrl(doc.document);
                    if (!href) return null;
                    return (
                      <MenuItem
                        key={doc.id}
                        icon={Download}
                        href={href}
                        external
                        onClick={() => {
                          recordDownload();
                          closeMenu();
                        }}
                      >
                        {doc.label || "Supplementary file"}
                      </MenuItem>
                    );
                  })}
                </MenuSection>

                {gre?.external_url && (
                  <MenuSection title="Publisher">
                    <MenuItem
                      icon={ExternalLink}
                      href={gre.external_url}
                      external
                      onClick={closeMenu}
                    >
                      {closedAccess ? "Publisher access" : "External publication"}
                    </MenuItem>
                  </MenuSection>
                )}

                <MenuSection title="Share">
                  <MenuItem icon={Copy} onClick={() => void handleCopyLink()}>
                    Copy paper link
                  </MenuItem>
                  <MenuItem
                    icon={Share2}
                    href={linkedInShareUrl}
                    external
                    onClick={() => {
                      void recordShare("linkedin");
                      closeMenu();
                    }}
                  >
                    Share on LinkedIn
                  </MenuItem>
                  <MenuItem
                    icon={Share2}
                    href={whatsappShareUrl}
                    external
                    onClick={() => {
                      void recordShare("whatsapp");
                      closeMenu();
                    }}
                  >
                    Share on WhatsApp
                  </MenuItem>
                  {"share" in navigator && (
                    <MenuItem
                      icon={Share2}
                      onClick={() => void handleNativeShare()}
                    >
                      System share…
                    </MenuItem>
                  )}
                </MenuSection>
                </div>,
                document.body
              )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200/80 pt-4">
          <button
            type="button"
            onClick={handleToggleLike}
            disabled={!user || engagementBusy === "like"}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              likedByMe
                ? "bg-brand-100 text-brand-800 ring-1 ring-brand-200"
                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            } ${!user ? "cursor-not-allowed opacity-60" : ""}`}
            title={user ? "Like this paper" : "Sign in to like papers"}
          >
            <ThumbsUp className={`h-4 w-4 ${likedByMe ? "fill-current" : ""}`} />
            {likesCount}
          </button>

          <span className="hidden h-5 w-px bg-slate-200 sm:block" aria-hidden />

          <button
            type="button"
            onClick={() => void handleCopyLink()}
            disabled={engagementBusy === "share"}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            <Copy className="h-4 w-4" />
            Copy link
          </button>

          {"share" in navigator && (
            <button
              type="button"
              onClick={() => void handleNativeShare()}
              disabled={engagementBusy === "share"}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
          )}

          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-slate-100/90 px-3 py-2 text-xs font-medium text-slate-600">
            <Share2 className="h-3.5 w-3.5 text-slate-400" />
            {shareCount} share{shareCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>

    </section>
  );
}
