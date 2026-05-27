import { ManuscriptContent } from "./ManuscriptContent";

interface Props {
  title: string;
  body?: string | null;
}

export function PublicationManuscriptSection({ title, body }: Props) {
  if (!body?.trim()) return null;

  return (
    <section className="publication-paper-section rounded-2xl border border-slate-200/70 bg-white px-5 py-5 sm:px-7 sm:py-6">
      <h2 className="text-sm font-bold uppercase tracking-wider text-brand-600">{title}</h2>
      <ManuscriptContent value={body} className="mt-4" />
    </section>
  );
}
