import { sanitizeHtml } from "../../lib/sanitizeHtml";

function isHtml(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content);
}

interface Props {
  title: string;
  body?: string | null;
}

export function PublicationManuscriptSection({ title, body }: Props) {
  if (!body?.trim()) return null;
  const html = isHtml(body);

  return (
    <section className="publication-paper-section rounded-2xl border border-slate-200/70 bg-white px-5 py-5 sm:px-7 sm:py-6">
      <h2 className="text-sm font-bold uppercase tracking-wider text-brand-600">{title}</h2>
      {html ? (
        <div
          className="gre-html-content mt-4 text-base leading-relaxed text-slate-700"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(body) }}
        />
      ) : (
        <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-slate-700">{body}</p>
      )}
    </section>
  );
}
