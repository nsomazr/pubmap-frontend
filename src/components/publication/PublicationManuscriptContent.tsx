import { PublicationReadingPaper } from "./PublicationReadingPaper";
import type { PublicationManuscriptFields } from "./PublicationPaperDocument";
import { publicationHasGrePaperBody } from "../../lib/publicationReadable";
import {
  grePublicationSectionCardClass,
  grePublicationSectionDescClass,
  grePublicationSectionHeadClass,
  grePublicationSectionTitleClass,
} from "../../lib/publicationPageStyles";
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
    <article className={`publication-manuscript min-w-0 overflow-hidden ${grePublicationSectionCardClass}`}>
      <header className={`${grePublicationSectionHeadClass} px-1`}>
        <h2 className={grePublicationSectionTitleClass}>Manuscript</h2>
        <p className={grePublicationSectionDescClass}>
          Structured summary on GRE (abstract, sections, and figures)
        </p>
      </header>
      <PublicationReadingPaper {...props} embedded />
      <div className="h-6 sm:h-8" aria-hidden />
    </article>
  );
}
