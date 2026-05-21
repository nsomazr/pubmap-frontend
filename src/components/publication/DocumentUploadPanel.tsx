import { AlertCircle, FileUp, Loader2, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "../ui/Button";
import type { ExtractedManuscript } from "../../lib/publicationExtract";
import { PdfPreview } from "./PdfPreview";

const ACCEPT = ".pdf,.doc,.docx,.txt,.rtf";

interface Props {
  file: File | null;
  onFileChange: (file: File | null) => void;
  extracting: boolean;
  extractError: string;
  extracted: ExtractedManuscript | null;
  onExtract: () => void;
  onApplyExtracted: () => void;
  onContinueToForm: () => void;
}

export function DocumentUploadPanel({
  file,
  onFileChange,
  extracting,
  extractError,
  extracted,
  onExtract,
  onApplyExtracted,
  onContinueToForm,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const pick = (f: File | null) => {
    onFileChange(f);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
      <div className="space-y-4">
        <div
          role="button"
          tabIndex={0}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) pick(f);
          }}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition ${
            dragOver
              ? "border-brand-400 bg-brand-50/80"
              : "border-slate-200 bg-slate-50/50 hover:border-brand-300 hover:bg-brand-50/30"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0] ?? null)}
          />
          <FileUp className="mx-auto h-12 w-12 text-brand-500" />
          <p className="mt-4 text-base font-semibold text-ink">
            {file ? file.name : "Drop your manuscript here"}
          </p>
          <p className="mt-2 text-sm text-slate-500">PDF, DOCX, DOC, TXT, or RTF · max 25 MB</p>
        </div>

        {file && (
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={onExtract} disabled={extracting}>
              {extracting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Extract title & abstract
            </Button>
            <Button type="button" variant="secondary" onClick={() => pick(null)}>
              Remove file
            </Button>
          </div>
        )}

        {extractError && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {extractError}
          </p>
        )}

        {extracted?.warnings && extracted.warnings.length > 0 && (
          <ul className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
            {extracted.warnings.map((w, i) => (
              <li key={i} className="flex gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {w}
              </li>
            ))}
          </ul>
        )}

        {extracted?.success && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
            <p className="text-sm font-semibold text-emerald-900">Title and abstract ready</p>
            <p className="mt-1 text-xs text-emerald-800">
              Apply to the form, set category and map location, then save. Readers will see the full PDF.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" onClick={onApplyExtracted}>
                Apply to editor
              </Button>
              <Button type="button" variant="secondary" onClick={onContinueToForm}>
                Continue to editor
              </Button>
            </div>
          </div>
        )}
      </div>

      <PdfPreview
        file={file}
        title="Manuscript preview"
        className="min-h-[320px] lg:min-h-[480px]"
        emptyState="upload"
      />
    </div>
  );
}
