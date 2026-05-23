import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import {
  deletePublicationDocument,
  uploadSupplementaryDocument,
  type GreDocument,
} from "../../lib/publicationGre";
import { mediaUrl } from "../../lib/mediaUrl";
import { Input } from "../ui/Input";

const ACCEPT = ".pdf,.doc,.docx,.txt,.rtf,.zip,.csv,.xlsx,.xls,.png,.jpg,.jpeg";

interface Props {
  publicationId: number;
  documents?: GreDocument[];
  disabled?: boolean;
}

export function PublicationSupplementaryUpload({
  publicationId,
  documents = [],
  disabled,
}: Props) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState("");
  const [localError, setLocalError] = useState("");

  const supplementary = documents.filter((d) => d.kind === "supplementary");

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadSupplementaryDocument(publicationId, file, label),
    onSuccess: () => {
      setLocalError("");
      setLabel("");
      queryClient.invalidateQueries({ queryKey: ["publication-edit", String(publicationId)] });
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setLocalError(err.response?.data?.detail || "Upload failed.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (docId: number) => deletePublicationDocument(publicationId, docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publication-edit", String(publicationId)] });
    },
  });

  const onPick = (file: File | null) => {
    if (!file || disabled) return;
    setLocalError("");
    uploadMutation.mutate(file);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 ring-1 ring-slate-200/80 sm:p-6">
      <h3 className="text-sm font-bold uppercase tracking-wider text-brand-600">
        Supplementary materials
      </h3>
      <p className="mt-1 text-sm text-slate-600">
        Attach datasets, appendices, or extra files readers can download alongside the publication.
      </p>

      {!disabled && (
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[12rem] flex-1">
            <Input
              label="File label (optional)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Appendix A - survey data"
            />
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => {
              onPick(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={uploadMutation.isPending}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-dashed border-brand-300 bg-brand-50/50 px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploadMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Upload file
          </button>
        </div>
      )}

      {localError && <p className="mt-3 text-sm text-red-600">{localError}</p>}

      {supplementary.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {supplementary.map((doc) => {
            const url = mediaUrl(doc.document);
            const name = doc.label || doc.document.split("/").pop() || "Supplementary file";
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
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(doc.id)}
                      disabled={deleteMutation.isPending}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Remove supplementary file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-slate-500">No supplementary files uploaded yet.</p>
      )}
    </section>
  );
}
