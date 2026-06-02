import { PublicationFiguresDisplay } from "./PublicationFiguresDisplay";
import { PublicationManuscriptSection } from "./PublicationManuscriptSection";
import type { PublicationFigure } from "../../lib/publicationGre";

type Props = {
  introduction?: string | null;
  methods?: string | null;
  findings?: string | null;
  conclusion?: string | null;
  figures?: PublicationFigure[];
  publicationId?: number | string;
  encodedPublicationId?: string | null;
  variant?: "composer" | "public";
  layout?: "card" | "flat";
  showFigures?: boolean;
};

/** Narrative sections with research figures placed after Methods. */
export function PublicationManuscriptBody({
  introduction,
  methods,
  findings,
  conclusion,
  figures = [],
  publicationId = 0,
  encodedPublicationId,
  variant = "public",
  layout = "card",
  showFigures = true,
}: Props) {
  const hasNarrative = [introduction, methods, findings, conclusion].some((s) =>
    Boolean(s?.trim())
  );
  const hasFigures = showFigures && figures.length > 0;

  if (!hasNarrative && !hasFigures) return null;

  const sectionGap = layout === "flat" ? "space-y-8" : "space-y-4";

  return (
    <div className={layout === "flat" ? "min-w-0 space-y-8" : undefined}>
      <div className={sectionGap}>
        <PublicationManuscriptSection
          title="Introduction"
          body={introduction}
          layout={layout}
        />
        <PublicationManuscriptSection title="Methods" body={methods} layout={layout} />
      </div>
      {hasFigures && (
        <PublicationFiguresDisplay
          figures={figures}
          publicationId={publicationId}
          encodedPublicationId={encodedPublicationId}
          variant={variant}
          layout={layout}
        />
      )}
      <div className={sectionGap}>
        <PublicationManuscriptSection title="Findings" body={findings} layout={layout} />
        <PublicationManuscriptSection title="Conclusion" body={conclusion} layout={layout} />
      </div>
    </div>
  );
}
