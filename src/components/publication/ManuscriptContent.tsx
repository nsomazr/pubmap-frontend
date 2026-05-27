import { renderManuscriptHtml } from "../../lib/renderManuscriptHtml";

type ManuscriptContentProps = {
  value?: string | null;
  className?: string;
};

/** Rendered manuscript body (markdown, LaTeX, or rich HTML) with GRE typography. */
export function ManuscriptContent({ value, className = "" }: ManuscriptContentProps) {
  const html = renderManuscriptHtml(value);
  if (!html) return null;

  return (
    <div
      className={`gre-html-content gre-manuscript-body min-w-0 max-w-full text-base leading-relaxed text-slate-700 ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
