import { FileUp, PenLine } from "lucide-react";

export type PublicationEntryMode = "upload" | "form";

interface Props {
  mode: PublicationEntryMode;
  onChange: (mode: PublicationEntryMode) => void;
}

export function PublicationModeSelector({ mode, onChange }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <button
        type="button"
        onClick={() => onChange("upload")}
        className={`group relative overflow-hidden rounded-2xl border-2 p-6 text-left transition ${
          mode === "upload"
            ? "border-brand-500 bg-gradient-to-br from-brand-50 to-teal-50/80 shadow-md ring-2 ring-brand-200"
            : "border-slate-200 bg-white hover:border-brand-200 hover:shadow-sm"
        }`}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/25">
          <FileUp className="h-6 w-6" />
        </span>
        <h3 className="mt-4 text-lg font-bold text-ink">Open access paper</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Upload the full PDF or Word manuscript. Readers download the complete paper after approval.
          Add supplementary files and external links in the access panel below.
        </p>
      </button>

      <button
        type="button"
        onClick={() => onChange("form")}
        className={`group relative overflow-hidden rounded-2xl border-2 p-6 text-left transition ${
          mode === "form"
            ? "border-brand-500 bg-gradient-to-br from-brand-50 to-teal-50/80 shadow-md ring-2 ring-brand-200"
            : "border-slate-200 bg-white hover:border-brand-200 hover:shadow-sm"
        }`}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-white shadow-lg">
          <PenLine className="h-6 w-6" />
        </span>
        <h3 className="mt-4 text-lg font-bold text-ink">Structured — restricted study</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Fill abstract, methods, findings, keywords, and conclusions in the editor. Choose{" "}
          <strong>Restricted — closed</strong> in the access panel to publish GRE summaries instead of the full PDF.
        </p>
      </button>
    </div>
  );
}
