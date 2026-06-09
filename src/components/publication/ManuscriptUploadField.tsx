import { FileUp, Link2, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { fetchManuscriptPdfFromUrl } from "../../lib/manuscriptSourceUrl";
import { PdfPreview } from "./PdfPreview";

const ACCEPT = ".pdf,.doc,.docx,.txt,.rtf";
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
const MAX_FILE_SIZE_LABEL = "25 MB";

type SourceMode = "upload" | "link";

interface Props {
  file: File | null;
  onFileChange: (file: File | null) => void;
  existingDocumentPath?: string | null;
  previewUrl?: string | null;
  disabled?: boolean;
}

export function ManuscriptUploadField({
  file,
  onFileChange,
  existingDocumentPath,
  previewUrl,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<SourceMode>("upload");
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkFetching, setLinkFetching] = useState(false);
  const [importedFromLink, setImportedFromLink] = useState(false);

  const hasPreview = Boolean(file || existingDocumentPath);

  const clearSource = () => {
    setLocalError("");
    setLinkUrl("");
    setImportedFromLink(false);
    onFileChange(null);
  };

  const handlePickedFile = (nextFile: File | null) => {
    if (!nextFile) {
      clearSource();
      return;
    }
    if (nextFile.size > MAX_FILE_SIZE_BYTES) {
      setLocalError(`File must be ${MAX_FILE_SIZE_LABEL} or smaller.`);
      return;
    }
    setLocalError("");
    setImportedFromLink(false);
    setLinkUrl("");
    onFileChange(nextFile);
  };

  const handleFetchLink = async () => {
    if (disabled || linkFetching) return;
    setLocalError("");
    setLinkFetching(true);
    try {
      const pdfFile = await fetchManuscriptPdfFromUrl(linkUrl);
      if (pdfFile.size > MAX_FILE_SIZE_BYTES) {
        setLocalError(`File must be ${MAX_FILE_SIZE_LABEL} or smaller.`);
        return;
      }
      setImportedFromLink(true);
      onFileChange(pdfFile);
    } catch (err) {
      setImportedFromLink(false);
      onFileChange(null);
      setLocalError(err instanceof Error ? err.message : "Could not fetch PDF from that link.");
    } finally {
      setLinkFetching(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-xl bg-slate-100 p-1 ring-1 ring-slate-200/80">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setMode("upload");
            setLocalError("");
          }}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            mode === "upload"
              ? "bg-white text-brand-700 shadow-sm"
              : "text-slate-600 hover:text-ink"
          }`}
        >
          <FileUp className="h-4 w-4" />
          Upload file
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setMode("link");
            setLocalError("");
          }}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            mode === "link"
              ? "bg-white text-brand-700 shadow-sm"
              : "text-slate-600 hover:text-ink"
          }`}
        >
          <Link2 className="h-4 w-4" />
          PDF link
        </button>
      </div>

      {mode === "upload" ? (
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
            {file && !importedFromLink
              ? file.name
              : existingDocumentPath
                ? "Replace uploaded manuscript"
                : "Upload original publication"}
          </p>
        </div>
      ) : (
        <div className="space-y-3 border-t border-slate-100 pt-4">
          <label className="block text-sm font-medium text-slate-700">Link to PDF</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="url"
              value={linkUrl}
              disabled={disabled || linkFetching}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleFetchLink();
                }
              }}
              placeholder="https://journal.example.org/article.pdf"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-brand-400 gre-field focus:outline-none focus:ring-0"
            />
            <button
              type="button"
              disabled={disabled || linkFetching || !linkUrl.trim()}
              onClick={() => void handleFetchLink()}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {linkFetching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Fetching PDF…
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4" />
                  Get PDF from link
                </>
              )}
            </button>
          </div>
          {importedFromLink && file && (
            <p className="text-xs font-medium text-brand-700">
              Imported: {file.name}. Preview and extraction below.
            </p>
          )}
        </div>
      )}

      {localError && <p className="text-sm text-red-600">{localError}</p>}

      {(file || existingDocumentPath) && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={disabled || linkFetching}
            onClick={clearSource}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-red-200 hover:text-red-600"
          >
            Remove source publication
          </button>
        </div>
      )}

      {hasPreview && (
        <PdfPreview
          file={file}
          documentPath={existingDocumentPath}
          previewUrl={previewUrl}
          title="Manuscript preview"
          className="min-h-[240px]"
          emptyState="upload"
        />
      )}
    </div>
  );
}
