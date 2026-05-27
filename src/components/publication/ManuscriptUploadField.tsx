import { FileUp } from "lucide-react";
import { useRef, useState } from "react";
import { PdfPreview } from "./PdfPreview";

const ACCEPT = ".pdf,.doc,.docx,.txt,.rtf";
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
const MAX_FILE_SIZE_LABEL = "25 MB";

interface Props {
  file: File | null;
  onFileChange: (file: File | null) => void;
  existingDocumentPath?: string | null;
  disabled?: boolean;
}

export function ManuscriptUploadField({
  file,
  onFileChange,
  existingDocumentPath,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState("");

  const hasPreview = Boolean(file || existingDocumentPath);

  const handlePickedFile = (nextFile: File | null) => {
    if (!nextFile) {
      setLocalError("");
      onFileChange(null);
      return;
    }
    if (nextFile.size > MAX_FILE_SIZE_BYTES) {
      setLocalError(`File must be ${MAX_FILE_SIZE_LABEL} or smaller.`);
      return;
    }
    setLocalError("");
    onFileChange(nextFile);
  };

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onDragOver={(e) => {
          if (disabled) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          if (disabled) return;
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handlePickedFile(f);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && !disabled && inputRef.current?.click()}
        className={`rounded-2xl border-2 border-dashed p-6 text-center transition ${
          disabled
            ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
            : dragOver
              ? "cursor-pointer border-brand-400 bg-brand-50/80"
              : "cursor-pointer border-slate-200 bg-slate-50/50 hover:border-brand-300 hover:bg-brand-50/30"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            handlePickedFile(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
        />
        <FileUp className="mx-auto h-10 w-10 text-brand-500" />
        <p className="mt-3 text-sm font-semibold text-ink">
          {file ? file.name : existingDocumentPath ? "Replace uploaded manuscript" : "Upload original paper (optional)"}
        </p>
        <p className="mt-1 text-xs text-slate-500">PDF, DOCX, DOC, TXT, or RTF · max 25 MB</p>
      </div>
      {localError && <p className="text-sm text-red-600">{localError}</p>}

      {(file || existingDocumentPath) && (
        <div className="flex flex-wrap gap-2">
          {file && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onFileChange(null)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-red-200 hover:text-red-600"
            >
              Remove selected file
            </button>
          )}
        </div>
      )}

      {hasPreview && (
        <PdfPreview
          file={file}
          documentPath={existingDocumentPath}
          title="Manuscript preview"
          className="min-h-[240px]"
          emptyState="upload"
        />
      )}
    </div>
  );
}
