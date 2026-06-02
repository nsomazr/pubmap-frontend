import { PublicationReadingPaper } from "./PublicationReadingPaper";
import type { PublicationManuscriptFields } from "./PublicationPaperDocument";
import { publicationHasGrePaperBody } from "../../lib/publicationReadable";
import type { Publication } from "../../types";

type Props = PublicationManuscriptFields & {
  isClosed?: boolean;
};

function hasManuscriptContent(
  props: PublicationManuscriptFields,
  isClosed: boolean
): boolean {
  if (isClosed) {
    return Boolean(props.abstract?.trim());
  }
  return publicationHasGrePaperBody({
    abstract: props.abstract,
    keywords: props.keywords,
    introduction: props.introduction,
    methods: props.methods,
    findings: props.findings,
    conclusion: props.conclusion,
    references: props.references,
    figures: props.figures,
  } as Pick<
    Publication,
    | "abstract"
    | "keywords"
    | "introduction"
    | "methods"
    | "findings"
    | "conclusion"
    | "references"
    | "figures"
  >);
}

/** Structured GRE manuscript (abstract + sections), separate from the PDF in Publication access. */
export function PublicationManuscriptContent({ isClosed = false, ...props }: Props) {
  if (!hasManuscriptContent(props, isClosed)) return null;

  return (
    <article className="publication-manuscript min-w-0 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
      <header className="border-b border-slate-100 px-5 py-4 sm:px-7">
        <h2 className="text-sm font-bold uppercase tracking-wider text-brand-600">Manuscript</h2>
        <p className="mt-1 text-xs text-slate-500">
          Structured summary on GRE (abstract, sections, and figures)
        </p>
      </header>
      <PublicationReadingPaper {...props} embedded />
      <div className="h-6 sm:h-8" aria-hidden />
    </article>
  );
}
