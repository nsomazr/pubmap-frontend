import { ImagePlus } from "lucide-react";
import { paperLogoSpecsText, PAPER_LOGO_ACCEPT } from "../../lib/paperLogoSpecs";

interface Props {
  label?: string;
  file: File | null;
  onChange: (file: File | null) => void;
  className?: string;
  /** Inline row for dense admin forms */
  compact?: boolean;
}

export function PaperLogoUploadField({
  label = "Paper logo",
  file,
  onChange,
  className = "",
  compact = false,
}: Props) {
  if (compact) {
    return (
      <div className={className}>
        <p className="text-xs font-medium text-slate-700">{label}</p>
        <label className="mt-1.5 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:bg-brand-50/50">
          <ImagePlus className="h-4 w-4 shrink-0 text-brand-600" />
          <span className="truncate">{file ? file.name : "Choose logo (optional)"}</span>
          <input
            type="file"
            accept={PAPER_LOGO_ACCEPT}
            className="hidden"
            onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>
    );
  }

  return (
    <div className={className}>
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <p className="mt-1 text-xs text-slate-500">{paperLogoSpecsText()}</p>
      <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:bg-brand-50/40">
        <ImagePlus className="h-4 w-4 text-brand-600" />
        Choose logo
        <input
          type="file"
          accept={PAPER_LOGO_ACCEPT}
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </label>
      {file && (
        <p className="mt-2 truncate text-xs font-medium text-brand-700" title={file.name}>
          Selected: {file.name}
        </p>
      )}
    </div>
  );
}
