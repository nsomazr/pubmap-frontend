import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2, Sparkles, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import api from "../../lib/api";
import { mediaUrl } from "../../lib/mediaUrl";
import {
  extractDocument,
  uploadDocumentWithExtract,
  type ExtractedManuscript,
} from "../../lib/publicationExtract";
import type { Publication } from "../../types";
import { PdfPreview } from "./PdfPreview";
import { Button } from "../ui/Button";

const ACCEPT = ".pdf,.doc,.docx,.txt,.rtf";

interface Props {
  publicationId: number;
  documents?: Publication["documents"];
  disabled?: boolean;
  disabledHint?: string;
  onExtracted?: (data: ExtractedManuscript) => void;
}

export function PublicationDocumentUpload({
  publicationId,
  documents = [],
  disabled,
  disabledHint,
  onExtracted,
}: Props) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState("");
  const [extracting, setExtracting] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("document", file);
      const { data } = await api.post(
        `/publications/${publicationId}/upload_document/`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return data;
    },
    onSuccess: () => {
      setLocalError("");
      queryClient.invalidateQueries({ queryKey: ["publication-edit", String(publicationId)] });
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setLocalError(err.response?.data?.detail || "Upload failed.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (docId: number) =>
      api.delete(`/publications/${publicationId}/documents/${docId}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publication-edit", String(publicationId)] });
    },
  });

  const onPick = (file: File | null) => {
    if (!file || disabled) return;
    setLocalError("");
    uploadMutation.mutate(file);
  };

  const runExtract = async (file: File) => {
    setExtracting(true);
    setLocalError("");
    try {
      const data = await extractDocument(file);
      if (data.success) {
        onExtracted?.(data);
        await uploadDocumentWithExtract(publicationId, file, false);
        queryClient.invalidateQueries({ queryKey: ["publication-edit", String(publicationId)] });
      } else {
        setLocalError(data.warnings?.[0] || "Extraction failed.");
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setLocalError(e.response?.data?.detail || "Extraction failed.");
    } finally {
      setExtracting(false);
    }
  };

  const primaryDoc = documents[0];

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Attach a PDF or Word file. Extract sections into the editor, or let readers download it.
      </p>
      {disabled && disabledHint && (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{disabledHint}</p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            onPick(f);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={disabled || uploadMutation.isPending}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-xl border border-dashed border-brand-300 bg-brand-50/50 px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploadMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          Upload document
        </button>
        {onExtracted && (
          <Button
            type="button"
            variant="secondary"
            disabled={disabled || extracting || !primaryDoc}
            onClick={async () => {
              if (!primaryDoc) return;
              const url = mediaUrl(primaryDoc.document);
              if (!url) return;
              try {
                const res = await fetch(url);
                const blob = await res.blob();
                const name = primaryDoc.document.split("/").pop() || "document.pdf";
                await runExtract(new File([blob], name, { type: blob.type }));
              } catch {
                setLocalError("Could not read the stored file for extraction.");
              }
            }}
          >
            {extracting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Re-extract from file
          </Button>
        )}
      </div>
      {localError && <p className="text-sm text-red-600">{localError}</p>}

      {primaryDoc && (
        <PdfPreview documentPath={primaryDoc.document} className="min-h-[280px]" />
      )}

      {documents.length > 0 && (
        <ul className="space-y-2">
          {documents.map((doc) => {
            const url = mediaUrl(doc.document);
            const name = doc.document.split("/").pop() || "Document";
            return (
              <li
                key={doc.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
              >
                <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-700">
                  <FileText className="h-4 w-4 shrink-0 text-brand-600" />
                  <span className="truncate">{name}</span>
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-brand-600 hover:underline"
                    >
                      Open
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(doc.id)}
                    disabled={deleteMutation.isPending}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Remove document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
