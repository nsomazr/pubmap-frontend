import { useEffect, useState } from "react";

/** Never reaches 100 until extraction completes — avoids a “stuck at 100%” feel. */
const PROGRESS_CAP = 96;

/** Smooth asymptotic curve tuned for ~30s–3min extractions. */
export function computeExtractionProgress(elapsedMs: number): number {
  const seconds = elapsedMs / 1000;
  const value = PROGRESS_CAP * (1 - Math.exp(-seconds / 55));
  return Math.min(Math.round(value * 10) / 10, PROGRESS_CAP);
}

const STATUS_THRESHOLDS: { until: number; label: string }[] = [
  { until: 12, label: "Opening your document…" },
  { until: 28, label: "Reading text from the manuscript…" },
  { until: 52, label: "Finding the title and section headings…" },
  { until: 74, label: "Matching sections to GRE fields…" },
  { until: 90, label: "Polishing extracted content…" },
  { until: 101, label: "Finishing up…" },
];

export function extractionProgressLabel(percent: number): string {
  for (const { until, label } of STATUS_THRESHOLDS) {
    if (percent < until) return label;
  }
  return STATUS_THRESHOLDS[STATUS_THRESHOLDS.length - 1].label;
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
