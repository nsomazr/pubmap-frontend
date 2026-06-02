import { FileText, Loader2, Maximize2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { mediaUrl } from "../../lib/mediaUrl";

interface Props {
  file?: File | null;
  documentPath?: string | null;
  /** Direct URL for PDF preview (e.g. API-generated GRE publication PDF). */
  previewUrl?: string | null;
  className?: string;
  title?: string;
  /** Show fullscreen expand control (default true when a PDF is available). */
  allowExpand?: boolean;
  /** Upload UI copy when nothing is selected; publication view uses "No PDF available". */
  emptyState?: "upload" | "publication";
  /** Inline height: one page viewport (scroll inside PDF); default is taller manuscript view. */
  layout?: "default" | "page";
}

function NoPdfAvailable({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center ${className}`}
    >
      <FileText className="h-10 w-10 text-slate-300" />
      <p className="mt-3 text-sm font-medium text-slate-600">No PDF available</p>
      <p className="mt-1 text-xs text-slate-500">
        This publication does not include a manuscript PDF.
      </p>
    </div>
  );
}

function PdfLoadFailed({
  className = "",
  openUrl,
  detail,
}: {
  className?: string;
  openUrl?: string | null;
  detail?: string | null;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center ${className}`}
    >
      <FileText className="h-10 w-10 text-slate-400" />
      <p className="mt-3 text-sm font-medium text-slate-700">Unable to preview this PDF</p>
      <p className="mt-1 text-xs text-slate-500">
        {detail || "Try opening it in a new tab."}
      </p>
      {openUrl && (
        <a
          href={openUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 text-sm font-semibold text-brand-600 hover:underline"
        >
          Open PDF in new tab
        </a>
      )}
    </div>
  );
}

function isPdf(file?: File | null, path?: string | null): boolean {
  if (file) return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const p = (path || "").toLowerCase().split("?")[0];
  return p.endsWith(".pdf");
}

function pdfIframeSrc(url: string, layout: "default" | "page" = "default"): string {
  const params =
    layout === "page"
      ? "page=1&toolbar=1&navpanes=0&view=FitH"
      : "toolbar=1&navpanes=0";
  return `${url}#${params}`;
}

function PreviewFrame({
  src,
  title,
  className,
  layout = "default",
}: {
  src: string;
  title: string;
  className?: string;
  layout?: "default" | "page";
}) {
  const defaultClass =
    layout === "page"
      ? "h-[min(75vh,52rem)] w-full max-w-[48rem] bg-slate-100"
      : "min-h-[280px] w-full flex-1 bg-slate-100 md:min-h-[420px]";
  return (
    <iframe
      title={title}
      src={pdfIframeSrc(src, layout)}
      className={className ?? defaultClass}
    />
  );
}

export function PdfPreview({
  file,
  documentPath,
  previewUrl,
  className = "",
  title = "Document preview",
  allowExpand = true,
  emptyState: emptyStateProp,
  layout = "default",
}: Props) {
  const emptyState = emptyStateProp ?? (file ? "upload" : "publication");
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [remoteBlobUrl, setRemoteBlobUrl] = useState<string | null>(null);
  const [remoteLoadError, setRemoteLoadError] = useState(false);
  const [remoteHttpStatus, setRemoteHttpStatus] = useState<number | null>(null);
  const [remoteErrorDetail, setRemoteErrorDetail] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!file) {
      setBlobUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const remoteUrl = useMemo(
    () => previewUrl ?? mediaUrl(documentPath ?? null),
    [previewUrl, documentPath]
  );

  useEffect(() => {
    if (file || !remoteUrl) {
      setRemoteBlobUrl(null);
      setRemoteLoadError(false);
      setRemoteHttpStatus(null);
      setRemoteErrorDetail(null);
      return;
    }
    let revoked: string | null = null;
    let cancelled = false;
    setRemoteLoadError(false);
    setRemoteHttpStatus(null);
    setRemoteErrorDetail(null);

    const token = localStorage.getItem("access_token");
    fetch(remoteUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async (res) => {
        if (!res.ok) {
          let detail: string | null = null;
          try {
            const payload = (await res.json()) as { detail?: string };
            detail = payload.detail?.trim() || null;
          } catch {
            detail = null;
          }
          if (!cancelled) {
            setRemoteHttpStatus(res.status);
            setRemoteErrorDetail(detail);
            setRemoteLoadError(true);
          }
          throw new Error(`HTTP ${res.status}`);
        }
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        revoked = URL.createObjectURL(blob);
        setRemoteBlobUrl(revoked);
      })
      .catch(() => {
        if (!cancelled) setRemoteLoadError((prev) => prev || true);
      });

    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [file, remoteUrl]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  const canUseDirectRemote =
    !file &&
    Boolean(remoteUrl) &&
    remoteLoadError &&
    remoteHttpStatus == null;
  const src = file ? blobUrl : remoteBlobUrl ?? (canUseDirectRemote ? remoteUrl : null);
  const pdf = previewUrl ? true : isPdf(file, documentPath);
  const canExpand = allowExpand && pdf && Boolean(src);
  const fileMissing =
    remoteLoadError && remoteHttpStatus != null && [404, 410].includes(remoteHttpStatus);

  if (!file && !documentPath && !previewUrl) {
    if (emptyState === "publication") {
      return <NoPdfAvailable className={className} />;
    }
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/80 p-8 text-center ${className}`}
      >
        <FileText className="h-10 w-10 text-slate-300" />
        <p className="mt-3 text-sm font-medium text-slate-500">No document to preview</p>
        <p className="mt-1 text-xs text-slate-400">Upload a PDF to see it here</p>
      </div>
    );
  }

  if (!file && documentPath && !remoteUrl) {
    return <NoPdfAvailable className={className} />;
  }

  if (!pdf) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center ${className}`}
      >
        <FileText className="h-10 w-10 text-brand-500" />
        <p className="mt-3 text-sm font-semibold text-ink">{file?.name || "Document attached"}</p>
        <p className="mt-1 text-xs text-slate-500">
          Inline preview is available for PDF. Other formats open in a new tab.
        </p>
        {remoteUrl && (
          <a
            href={remoteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 text-sm font-semibold text-brand-600 hover:underline"
          >
            Open file
          </a>
        )}
      </div>
    );
  }

  if ((file && !blobUrl) || (!file && remoteUrl && !remoteBlobUrl && !remoteLoadError)) {
    return (
      <div className={`flex items-center justify-center rounded-2xl bg-slate-100 ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  if (remoteLoadError && !file && !canUseDirectRemote) {
    if (fileMissing) {
      return <NoPdfAvailable className={className} />;
    }
    return <PdfLoadFailed className={className} openUrl={remoteUrl} detail={remoteErrorDetail} />;
  }

  if (!src) {
    return (
      <div className={`flex items-center justify-center rounded-2xl bg-slate-100 ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  const panel = (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${
        layout === "page" ? "max-w-full" : ""
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</p>
          {file && <p className="truncate text-sm font-medium text-ink">{file.name}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {(remoteUrl || remoteBlobUrl) && !file && (
            <a
              href={remoteBlobUrl ?? remoteUrl ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg px-2 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-50"
            >
              New tab
            </a>
          )}
          {canExpand && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
              aria-label="Expand PDF fullscreen"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Expand
            </button>
          )}
        </div>
      </div>
      <PreviewFrame src={src} title={title} layout={layout} />
    </div>
  );

  return (
    <>
      {panel}
      {expanded &&
        src &&
        createPortal(
          <div
            className="fixed inset-0 z-[2000] flex flex-col bg-slate-900/90 p-3 sm:p-5"
            role="dialog"
            aria-label="Expanded PDF preview"
          >
            <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                <p className="truncate text-sm font-semibold text-ink">{title}</p>
                <div className="flex items-center gap-2">
                  {remoteUrl && (
                    <a
                      href={remoteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-brand-600 hover:underline"
                    >
                      Open in new tab
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setExpanded(false)}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    <X className="h-4 w-4" />
                    Close
                  </button>
                </div>
              </div>
              <div className="min-h-0 flex-1">
                <PreviewFrame
                  src={src}
                  title={title}
                  className="h-[min(85vh,900px)] w-full bg-slate-100"
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
