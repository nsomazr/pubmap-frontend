import { ExternalLink, Link2, Lock, Unlock } from "lucide-react";
import type { PublicationAccessType, PublicationGre } from "../../lib/publicationGre";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";

interface Props {
  gre: PublicationGre;
  onChange: (next: PublicationGre) => void;
  disabled?: boolean;
  accessLocked?: boolean;
  onChangeAccess?: (type: PublicationAccessType) => void;
  /** Open access: optional manuscript upload UI */
  openUploadSlot?: React.ReactNode;
}

export function PublicationAccessFields({
  gre,
  onChange,
  disabled,
  accessLocked = false,
  onChangeAccess,
  openUploadSlot,
}: Props) {
  const isClosed = gre.access_type === "closed";
  const hasOpenUploadSlot = Boolean(openUploadSlot);

  return (
    <section className="space-y-5">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-brand-600">
          {isClosed ? "Publisher access" : hasOpenUploadSlot ? "Original paper & links" : "Access links"}
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          {isClosed
            ? "Link to where readers can access the full paper (journal, repository, or publisher page)."
            : hasOpenUploadSlot
              ? "Upload the original paper for GRE, link to a journal copy, or both."
              : "Add journal or DOI links that readers can use alongside the uploaded paper."}
        </p>
        {accessLocked ? (
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
            {isClosed ? (
              <>
                <Lock className="h-3.5 w-3.5" /> Restricted (closed access)
              </>
            ) : (
              <>
                <Unlock className="h-3.5 w-3.5" /> Open access
              </>
            )}
          </p>
        ) : (
          onChangeAccess && (
            <div className="mt-3 flex flex-wrap gap-2">
              {(["open", "closed"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChangeAccess(type)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${
                    gre.access_type === type
                      ? "bg-brand-600 text-white ring-brand-600"
                      : "bg-white text-slate-600 ring-slate-200 hover:ring-brand-200"
                  }`}
                >
                  {type === "open" ? "Open access" : "Restricted"}
                </button>
              ))}
            </div>
          )
        )}
      </div>

      {!isClosed && openUploadSlot}

      {isClosed ? (
        <Input
          label="Publisher access link"
          type="url"
          value={gre.external_url || ""}
          onChange={(e) => onChange({ ...gre, external_url: e.target.value })}
          placeholder="https://journal.example.org/full-text-article"
          disabled={disabled}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="External publication link"
            type="url"
            value={gre.external_url || ""}
            onChange={(e) => onChange({ ...gre, external_url: e.target.value })}
            placeholder="https://journal.example.org/article/..."
            disabled={disabled}
          />
          <Input
            label="Reference: DOI URL"
            type="url"
            value={gre.reference_url || ""}
            onChange={(e) => onChange({ ...gre, reference_url: e.target.value })}
            placeholder="https://doi.org/..."
            disabled={disabled}
          />
        </div>
      )}

      {isClosed && (
        <>
          <p className="flex items-start gap-2 rounded-xl border border-brand-100 bg-brand-50/50 px-3 py-2.5 text-xs text-slate-600">
            <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
            The access link is shown on your GRE publication so readers can request or read the full
            paper from the publisher, while the uploaded original stays visible only to the paper owner.
          </p>
          <Textarea
            label="Author summary (for GRE summary PDF)"
            value={gre.author_summary || ""}
            onChange={(e) => onChange({ ...gre, author_summary: e.target.value })}
            rows={4}
            placeholder="Plain-language summary readers can download when the full paper is restricted."
            disabled={disabled}
          />
        </>
      )}

      {gre.gre_doi && (
        <p className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-200">
          <ExternalLink className="h-3.5 w-3.5 text-brand-600" />
          GRE DOI: <strong className="text-brand-700">{gre.gre_doi}</strong>
        </p>
      )}
    </section>
  );
}
