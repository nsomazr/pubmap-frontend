import { Download, ExternalLink, Eye, EyeOff, FileText, MessageSquare } from "lucide-react";
import { useState } from "react";
import api from "../../lib/api";
import { summaryPdfUrl } from "../../lib/publicationGre";
import { mediaUrl } from "../../lib/mediaUrl";
import type { GreDocument, PublicationGre } from "../../lib/publicationGre";
import { PdfPreview } from "./PdfPreview";

interface Props {
  publicationId: number;
  gre?: PublicationGre;
  documents?: GreDocument[];
  isClosed?: boolean;
  publicationTitle?: string;
}

export function PublicationDownloadPanel({
  publicationId,
  gre,
  documents = [],
  isClosed,
  publicationTitle,
}: Props) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDiscussions, setPreviewDiscussions] = useState(false);

  const manuscript = documents.find((d) => !d.kind || d.kind === "manuscript") ?? documents[0];
  const supplementary = documents.filter((d) => d.kind === "supplementary");
  const fullUrl = manuscript?.document ? mediaUrl(manuscript.document) : null;
  const closedAccess = isClosed || gre?.access_type === "closed";

  const grePdfPreviewUrl = summaryPdfUrl(publicationId, {
    discussions: previewDiscussions,
    inline: true,
  });

  const recordDownload = () => {
    api.post("/stats/record/", { publication_id: publicationId, type: "download" }).catch(() => {});
  };

  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200/80 sm:p-6">
      <h2 className="text-xs font-bold uppercase tracking-widest text-brand-600">Downloads</h2>
      <p className="mt-1 text-sm text-slate-500">
        Download or preview the GRE-formatted publication PDF with header, sections, and research
        team.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <a
          href={summaryPdfUrl(publicationId)}
          onClick={recordDownload}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <FileText className="h-4 w-4" />
          GRE publication PDF
        </a>
        <button
          type="button"
          onClick={() => setPreviewOpen((open) => !open)}
          className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
            previewOpen
              ? "border-brand-300 bg-brand-50 text-brand-800"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          {previewOpen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {previewOpen ? "Hide preview" : "Preview PDF"}
        </button>
        {!closedAccess && fullUrl && (
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={recordDownload}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-100"
          >
            <Download className="h-4 w-4" />
            Full paper (uploaded PDF)
          </a>
        )}
        {closedAccess && (
          <a
            href={summaryPdfUrl(publicationId, { discussions: true })}
            onClick={recordDownload}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
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
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-slate-50"
          >
            <ExternalLink className="h-4 w-4" />
            {closedAccess ? "Publisher access" : "External publication"}
          </a>
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
              onClick={recordDownload}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              {doc.label || "Supplementary file"}
            </a>
          );
        })}
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
    </section>
  );
}
