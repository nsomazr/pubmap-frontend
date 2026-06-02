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
  showFigures = true,
}: Props) {
  const hasNarrative = [introduction, methods, findings, conclusion].some((s) =>
    Boolean(s?.trim())
  );
  const hasFigures = showFigures && figures.length > 0;

  if (!hasNarrative && !hasFigures) return null;

  return (
    <>
      <div className="space-y-4">
        <PublicationManuscriptSection title="Introduction" body={introduction} />
        <PublicationManuscriptSection title="Methods" body={methods} />
      </div>
      {hasFigures && (
        <PublicationFiguresDisplay
          figures={figures}
          publicationId={publicationId}
          encodedPublicationId={encodedPublicationId}
          variant={variant}
        />
      )}
      <div className="space-y-4">
        <PublicationManuscriptSection title="Findings" body={findings} />
        <PublicationManuscriptSection title="Conclusion" body={conclusion} />
      </div>
    </>
  );
}
