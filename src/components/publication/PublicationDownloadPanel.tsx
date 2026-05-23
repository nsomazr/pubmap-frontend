import { Download, FileText, MessageSquare } from "lucide-react";
import api from "../../lib/api";
import { summaryPdfUrl } from "../../lib/publicationGre";
import { mediaUrl } from "../../lib/mediaUrl";
import type { GreDocument, PublicationGre } from "../../lib/publicationGre";

interface Props {
  publicationId: number;
  gre?: PublicationGre;
  documents?: GreDocument[];
  isClosed?: boolean;
}

export function PublicationDownloadPanel({ publicationId, gre, documents = [], isClosed }: Props) {
  const manuscript = documents.find((d) => !d.kind || d.kind === "manuscript") ?? documents[0];
  const supplementary = documents.filter((d) => d.kind === "supplementary");
  const fullUrl = manuscript?.document ? mediaUrl(manuscript.document) : null;

  const recordDownload = () => {
    api.post("/stats/record/", { publication_id: publicationId, type: "download" }).catch(() => {});
  };

  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200/80 sm:p-6">
      <h2 className="text-xs font-bold uppercase tracking-widest text-brand-600">Downloads</h2>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {!isClosed && fullUrl && (
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={recordDownload}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Download className="h-4 w-4" />
            Full paper (PDF)
          </a>
        )}
        {(isClosed || gre?.access_type === "closed") && (
          <>
            <a
              href={summaryPdfUrl(publicationId)}
              onClick={recordDownload}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-100"
            >
              <FileText className="h-4 w-4" />
              GRE summary PDF
            </a>
            <a
              href={summaryPdfUrl(publicationId, true)}
              onClick={recordDownload}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <MessageSquare className="h-4 w-4" />
              Summary + discussion
            </a>
          </>
        )}
        {gre?.external_url && (
          <a
            href={gre.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-slate-50"
          >
            External publication
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
    </section>
  );
}
