import { useEffect, useState } from "react";

/** Never reaches 100 until extraction completes — drives step timing only. */
const PROGRESS_CAP = 96;

/** Smooth asymptotic curve tuned for ~30s–3min extractions. */
export function computeExtractionProgress(elapsedMs: number): number {
  const seconds = elapsedMs / 1000;
  const value = PROGRESS_CAP * (1 - Math.exp(-seconds / 55));
  return Math.min(Math.round(value * 10) / 10, PROGRESS_CAP);
}

export type ExtractionStep = {
  id: string;
  title: string;
  detail: string;
};

export const EXTRACTION_STEPS: ExtractionStep[] = [
  {
    id: "open",
    title: "Open your file",
    detail: "Load PDF or Word and prepare the document",
  },
  {
    id: "text",
    title: "Read the manuscript",
    detail: "Extract text from pages (OCR if the file is scanned)",
  },
  {
    id: "structure",
    title: "Detect structure",
    detail: "Title, abstract, keywords, and section headings",
  },
  {
    id: "sections",
    title: "Fill GRE sections",
    detail: "Summaries for introduction, methods, results, and more",
  },
  {
    id: "extras",
    title: "Funders & references",
    detail: "Funder names and five key bibliography entries",
  },
];

/** Map simulated progress to the active checklist step (0–4). */
export function extractionActiveStepIndex(percent: number): number {
  if (percent < 10) return 0;
  if (percent < 26) return 1;
  if (percent < 48) return 2;
  if (percent < 72) return 3;
  return 4;
}

export function useExtractionProgress(isActive: boolean): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setProgress(0);
      return;
    }

    const startedAt = performance.now();
    let frameId = 0;

    const tick = () => {
      setProgress(computeExtractionProgress(performance.now() - startedAt));
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isActive]);

  return progress;
}

/** Elapsed seconds while extraction is active (for “taking longer” hint). */
export function useExtractionElapsedSeconds(isActive: boolean): number {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setSeconds(0);
      return;
    }
    const startedAt = performance.now();
    const id = window.setInterval(() => {
      setSeconds(Math.floor((performance.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [isActive]);

  return seconds;
}
