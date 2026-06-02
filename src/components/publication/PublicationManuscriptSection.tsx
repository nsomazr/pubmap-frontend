import { ManuscriptContent } from "./ManuscriptContent";

interface Props {
  title: string;
  body?: string | null;
  layout?: "card" | "flat";
  variant?: "composer" | "public";
}

export function PublicationManuscriptSection({
  title,
  body,
  layout = "card",
  variant = "public",
}: Props) {
  if (!body?.trim()) return null;

  const flat = layout === "flat";

  return (
    <section
      className={
        flat
          ? "publication-paper-section min-w-0 scroll-mt-4"
          : "publication-paper-section gre-public-card min-w-0 overflow-hidden px-5 py-5 sm:px-7 sm:py-6"
      }
    >
      <h2
        className={
          flat
            ? variant === "public"
              ? "text-sm font-bold uppercase tracking-wider text-brand-600"
              : "text-xs font-bold uppercase tracking-wider text-slate-500"
            : "text-sm font-bold uppercase tracking-wider text-brand-600"
        }
      >
        {title}
      </h2>
      <ManuscriptContent value={body} className={flat ? "mt-3 min-w-0" : "mt-4 min-w-0"} />
    </section>
  );
}
