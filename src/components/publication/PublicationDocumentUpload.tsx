import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import api, { parseApiError } from "../../lib/api";
import { sanitizeExtractionWarnings } from "../../lib/extractionWarnings";
import { mediaUrl } from "../../lib/mediaUrl";
import type { Publication } from "../../types";
import { ManuscriptUploadField } from "./ManuscriptUploadField";

export interface ExtractedDocumentPayload {
  title?: string;
  abstract?: string;
  introduction?: string;
  methods?: string;
  findings?: string;
  conclusion?: string;
  funder?: string;
  references?: string;
  keywords?: string;
  warnings?: string[];
  section_notes?: Record<string, string>;
  extraction_engine?: string;
  success?: boolean;
}

interface Props {
  publicationId: number;
  documents?: Publication["documents"];
  disabled?: boolean;
  disabledHint?: string;
  extractOnUpload?: boolean;
  onExtracted?: (payload: ExtractedDocumentPayload) => void;
}

export function PublicationDocumentUpload({
  publicationId,
  documents = [],
  disabled,
  disabledHint,
  extractOnUpload = false,
  onExtracted,
}: Props) {
  const queryClient = useQueryClient();
  const [localError, setLocalError] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const primaryDoc = documents[0];
  const existingPath = primaryDoc?.document ?? null;

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("document", file);
      const params = extractOnUpload ? { extract: 1, use_ai: 1 } : undefined;

      try {
        const { data } = await api.post<{ extracted?: ExtractedDocumentPayload }>(
          `/publications/${publicationId}/upload_document/`,
          form,
          { params }
        );
        return data;
      } catch (error) {
        if (!extractOnUpload) throw error;
        const retryForm = new FormData();
        retryForm.append("document", file);
        const { data } = await api.post<{ extracted?: ExtractedDocumentPayload }>(
          `/publications/${publicationId}/upload_document/`,
          retryForm,
          { params: { extract: 1, use_ai: 0, ocr_backend: "tesseract" } }
        );
        if (data?.extracted) {
          data.extracted = {
            ...data.extracted,
            warnings: sanitizeExtractionWarnings(data.extracted.warnings),
          };
        }
        return data;
      }
    },
    onSuccess: (data) => {
      setLocalError("");
      setPendingFile(null);
      if (data?.extracted && onExtracted) {
        onExtracted({
          ...data.extracted,
          warnings: sanitizeExtractionWarnings(data.extracted.warnings),
        });
      }
      queryClient.invalidateQueries({ queryKey: ["publication-edit", String(publicationId)] });
    },
    onError: (err) => {
      setLocalError(parseApiError(err, "Upload failed."));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (docId: number) =>
      api.delete(`/publications/${publicationId}/documents/${docId}/`),
    onSuccess: () => {
      setPendingFile(null);
      queryClient.invalidateQueries({ queryKey: ["publication-edit", String(publicationId)] });
    },
  });

  const handleFileChange = (file: File | null) => {
    if (!file || disabled) {
      setPendingFile(null);
      return;
    }
    setPendingFile(file);
    uploadMutation.mutate(file);
  };

  const showField = !primaryDoc || pendingFile || uploadMutation.isPending;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Add your source paper by uploading a file or pasting a PDF link. GRE downloads the PDF,
        shows a preview, and can extract manuscript fields. Open papers show the file publicly after
        approval; closed papers keep it visible only to the owner.
      </p>
      {disabled && disabledHint && (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{disabledHint}</p>
      )}

      {uploadMutation.isPending && (
        <p className="flex items-center gap-2 text-sm text-brand-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          Uploading and processing…
        </p>
      )}

      {showField ? (
        <ManuscriptUploadField
          file={pendingFile}
          onFileChange={handleFileChange}
          existingDocumentPath={existingPath}
          disabled={disabled || uploadMutation.isPending}
        />
      ) : (
        <ManuscriptUploadField
          file={null}
          onFileChange={handleFileChange}
          existingDocumentPath={existingPath}
          disabled={disabled || uploadMutation.isPending}
        />
      )}

      {localError && <p className="text-sm text-red-600">{localError}</p>}

      {primaryDoc && !pendingFile && (
        <ul className="space-y-2">
          <li className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
            <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-700">
              <FileText className="h-4 w-4 shrink-0 text-brand-600" />
              <span className="truncate">
                {primaryDoc.document.split("/").pop() || "Document"}
              </span>
            </span>
            <div className="flex shrink-0 items-center gap-2">
              {mediaUrl(primaryDoc.document) && (
                <a
                  href={mediaUrl(primaryDoc.document)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-brand-600 hover:underline"
                >
                  Open
                </a>
              )}
              <button
                type="button"
                onClick={() => deleteMutation.mutate(primaryDoc.id)}
                disabled={deleteMutation.isPending || disabled}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                aria-label="Remove document"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        </ul>
      )}
    </div>
  );
}
