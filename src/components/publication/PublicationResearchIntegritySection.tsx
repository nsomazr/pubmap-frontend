import { AlertTriangle } from "lucide-react";
import { PublicationPageSection } from "./PublicationPageSection";

type Props = {
  onReport: () => void;
};

export function PublicationResearchIntegritySection({ onReport }: Props) {
  return (
    <PublicationPageSection
      id="research-integrity"
      title="Research integrity"
      icon={AlertTriangle}
      variant="amber"
      description="Report concerns about originality or attribution. GRE reviews all reports."
      titleAside={
        <button
          type="button"
          onClick={onReport}
          className="rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-900 shadow-sm transition hover:bg-amber-50"
        >
          Report concern
        </button>
      }
    />
  );
}
