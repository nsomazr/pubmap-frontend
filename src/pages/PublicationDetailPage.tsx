import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Download, Eye, FileText, MapPin, Sparkles, Users } from "lucide-react";
import api from "../lib/api";
import { assistantSummarizePublicationStream } from "../lib/assistant";
import { GreHeroBanner } from "../components/ui/GreHeroBanner";
import { PdfPreview } from "../components/publication/PdfPreview";
import { PublicationDiscussions } from "../components/publication/PublicationDiscussions";
import { PublicPageLayout } from "../components/layout/PublicPageLayout";
import { ResearchMap } from "../components/map/ResearchMap";
import { FormattedAssistantText } from "../lib/formatAssistantText";
import { mediaUrl } from "../lib/mediaUrl";
import { sanitizeHtml } from "../lib/sanitizeHtml";
import type { Publication } from "../types";

function isHtml(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content);
}

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

function Section({ title, body }: { title: string; body?: string | null }) {
  if (!body?.trim()) return null;
  const html = isHtml(body);
  return (
    <section className="rounded-3xl bg-white p-6 shadow-[0_4px_24px_-6px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/80 sm:p-8">
      <h2 className="text-xs font-bold uppercase tracking-widest text-brand-600">{title}</h2>
      {html ? (
        <div
          className="gre-html-content mt-4 text-lg leading-relaxed text-slate-700"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(body) }}
        />
      ) : (
        <p className="mt-4 whitespace-pre-wrap text-lg leading-relaxed text-slate-700">{body}</p>
      )}
    </section>
  );
}

export function PublicationDetailPage() {
  const { id } = useParams();
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  const { data: pub, isLoading, isError } = useQuery({
    queryKey: ["publication", id],
    queryFn: async () => {
      const { data } = await api.get<Publication>(`/publications/${id}/public/`);
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (pub?.id) {
      api.post("/stats/record/", { publication_id: pub.id, type: "view" }).catch(() => {});
    }
  }, [pub?.id]);

  const docPath = pub?.documents?.[0]?.document ?? null;
  const docUrl = docPath ? mediaUrl(docPath) : null;
  const hasPdf = Boolean(docPath?.toLowerCase().endsWith(".pdf"));

  const runSummary = () => {
    if (!pub?.id) return;
    setSummary("");
    setSummaryError("");
    setSummaryLoading(true);
    const controller = new AbortController();
    assistantSummarizePublicationStream(
      pub.id,
      {
        onToken: (t) => setSummary((s) => s + t),
        onError: (msg) => setSummaryError(msg),
        onDone: () => setSummaryLoading(false),
      },
      controller.signal
    ).catch((err: Error) => {
      if (err.name !== "AbortError") {
        setSummaryError(err.message || "Summary unavailable.");
        setSummaryLoading(false);
      }
    });
    return () => controller.abort();
  };

  if (isLoading) {
    return (
      <PublicPageLayout compactHero title="Publication" crumbs={[{ label: "Home", to: "/" }]}>
        <p className="text-slate-500">Loading…</p>
      </PublicPageLayout>
    );
  }

  if (isError || !pub) {
    return (
      <PublicPageLayout compactHero title="Not found" crumbs={[{ label: "Home", to: "/" }]}>
        <p className="text-slate-600">Publication not found or not yet published.</p>
        <Link to="/" className="mt-4 inline-block text-brand-600 hover:underline">
          Back to map
        </Link>
      </PublicPageLayout>
    );
  }

  const authorName =
    pub.author?.full_name ||
    `${pub.author?.firstname ?? ""} ${pub.author?.lastname ?? ""}`.trim();
  const authorInitials =
    `${pub.author?.firstname?.[0] ?? ""}${pub.author?.lastname?.[0] ?? ""}`.toUpperCase() ||
    "?";

  const abstractPlain = isHtml(pub.abstract) ? stripHtml(pub.abstract) : pub.abstract;

  return (
    <PublicPageLayout
      wide
      compactHero
      accent="blue"
      badge={pub.sub_category_name}
      title={pub.title}
      subtitle={
        authorName + (pub.author?.affiliation ? ` · ${pub.author.affiliation}` : "")
      }
      crumbs={[{ label: "Home", to: "/" }, { label: "Publication" }]}
    >
      <GreHeroBanner
        compact
        className="mb-6"
        photoUrl={pub.author?.photo}
        initials={authorInitials}
        icon={FileText}
        title={authorName || "Publication author"}
        subtitle={
          <>
            {pub.sub_category_name && (
              <span className="mr-2 rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700 ring-1 ring-brand-100">
                {pub.sub_category_name}
              </span>
            )}
            {pub.author?.affiliation}
          </>
        }
        meta={
          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-brand-600" />
              {pub.views_count ?? 0} views
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Download className="h-4 w-4 text-brand-600" />
              {pub.downloads_count ?? 0} downloads
            </span>
            {pub.short_number && (
              <span className="font-semibold text-brand-600">#{pub.short_number}</span>
            )}
          </div>
        }
      />

      <div className="space-y-6">
        {/* Search-list metadata: abstract + summary */}
        <section className="rounded-3xl bg-white p-6 ring-1 ring-slate-200/80 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="min-w-0 flex-1">
              <h2 className="text-xs font-bold uppercase tracking-widest text-brand-600">
                Abstract
              </h2>
              <p className="mt-3 text-base leading-relaxed text-slate-700">
                {abstractPlain?.trim() || "No abstract provided."}
              </p>
            </div>
            <button
              type="button"
              onClick={runSummary}
              disabled={summaryLoading}
              className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-100 disabled:opacity-60 sm:w-auto"
            >
              <Sparkles className="h-4 w-4" />
              {summaryLoading ? "Summarizing…" : "Get summary"}
            </button>
          </div>
          {(summary || summaryError) && (
            <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50/40 p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
                GRE Assistant summary
              </p>
              {summaryError ? (
                <p className="mt-2 text-sm text-amber-800">{summaryError}</p>
              ) : (
                <div className="mt-2 text-sm leading-relaxed text-slate-800">
                  <FormattedAssistantText content={summary} streaming={summaryLoading} />
                </div>
              )}
            </div>
          )}
        </section>

        {/* Primary reader experience: full PDF when attached */}
        {hasPdf && docPath ? (
          <section className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200/80">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
              <h2 className="font-semibold text-ink">Full manuscript (PDF)</h2>
              {docUrl && (
                <a
                  href={docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    api.post("/stats/record/", { publication_id: pub.id, type: "download" })
                  }
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline"
                >
                  <Download className="h-4 w-4" />
                  Download
                </a>
              )}
            </div>
            <PdfPreview documentPath={docPath} className="min-h-[min(75vh,900px)] rounded-none border-0" />
          </section>
        ) : (
          <>
            <Section title="Introduction" body={pub.introduction} />
            <Section title="Methods" body={pub.methods} />
            <Section title="Results" body={pub.results} />
            <Section title="Findings" body={pub.findings} />
            <Section title="Conclusion" body={pub.conclusion} />
            {docUrl && (
              <section className="rounded-3xl bg-white p-4 ring-1 ring-slate-200/80 sm:p-6">
                <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-brand-600">
                  Attached document
                </h2>
                <PdfPreview documentPath={docPath!} className="min-h-[480px]" />
              </section>
            )}
          </>
        )}

        {pub.coordinates && (
          <section className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200/80">
            <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
              <MapPin className="h-5 w-5 text-brand-600" />
              <h2 className="font-semibold text-ink">Study location</h2>
            </div>
            <ResearchMap publications={[pub]} height="360px" />
            <p className="px-6 py-3 text-sm text-slate-600">
              {pub.coordinates.location}
              {pub.coordinates.institution && ` · ${pub.coordinates.institution}`}
            </p>
          </section>
        )}

        <PublicationDiscussions publicationId={pub.id} />

        {pub.collaborators && pub.collaborators.length > 0 && (
          <section className="rounded-3xl bg-white p-6 ring-1 ring-slate-200/80 sm:p-8">
            <h2 className="flex items-center gap-2 font-semibold text-ink">
              <Users className="h-5 w-5 text-brand-600" />
              Collaborators
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {pub.collaborators.map((c, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm"
                >
                  <p className="font-medium text-ink">{c.fullname}</p>
                  <p className="text-slate-500">{c.affiliation}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {docUrl && !hasPdf && (
          <div className="text-center">
            <a
              href={docUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() =>
                api.post("/stats/record/", { publication_id: pub.id, type: "download" })
              }
              className="inline-flex items-center gap-2 rounded-xl gre-gradient-bar px-8 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-95"
            >
              <Download className="h-4 w-4" />
              Download document
            </a>
          </div>
        )}
      </div>
    </PublicPageLayout>
  );
}
