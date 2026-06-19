import type { ExtractionStep } from "./useExtractionProgress";

export const SUBMISSION_STEPS: ExtractionStep[] = [
  {
    id: "save",
    title: "Saving your draft",
    detail: "Writing title, abstract, manuscript sections, and metadata",
  },
  {
    id: "files",
    title: "Syncing files",
    detail: "Manuscript upload, figures, and figure captions",
  },
  {
    id: "authors",
    title: "Recording authors",
    detail: "Lead author, co-authors, and affiliations",
  },
  {
    id: "validate",
    title: "Checking your submission",
    detail: "Required fields and GRE publication standards",
  },
  {
    id: "review",
    title: "Sending for admin review",
    detail: "Your paper enters the GRE review queue",
  },
];

/** Map simulated progress to the active submission checklist step (0–4). */
export function submissionActiveStepIndex(percent: number): number {
  if (percent < 12) return 0;
  if (percent < 32) return 1;
  if (percent < 55) return 2;
  if (percent < 80) return 3;
  return 4;
}
