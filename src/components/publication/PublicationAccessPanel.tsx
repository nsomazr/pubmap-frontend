import { ExternalLink, Lock, Unlock } from "lucide-react";
import type { PublicationAccessType, PublicationGre } from "../../lib/publicationGre";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";

interface Props {
  gre: PublicationGre;
  onChange: (next: PublicationGre) => void;
  disabled?: boolean;
}

export function PublicationAccessPanel({ gre, onChange, disabled }: Props) {
  const setAccess = (access_type: PublicationAccessType) => onChange({ ...gre, access_type });

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 ring-1 ring-slate-200/80 sm:p-6">
      <h3 className="text-sm font-bold uppercase tracking-wider text-brand-600">
        Publication access
      </h3>
      <p className="mt-1 text-sm text-slate-600">
        Open access shares the full PDF. Restricted publications publish GRE summaries and structured sections instead of the full manuscript.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setAccess("open")}
          className={`rounded-xl border-2 p-4 text-left transition ${
            gre.access_type === "open"
              ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100"
              : "border-slate-200 hover:border-brand-200"
          }`}
        >
          <Unlock className="h-5 w-5 text-brand-600" />
          <p className="mt-2 font-semibold text-ink">Open access</p>
          <p className="mt-1 text-xs text-slate-600">Full PDF, supplementary files, external links</p>
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setAccess("closed")}
          className={`rounded-xl border-2 p-4 text-left transition ${
            gre.access_type === "closed"
              ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100"
              : "border-slate-200 hover:border-brand-200"
          }`}
        >
          <Lock className="h-5 w-5 text-slate-700" />
          <p className="mt-2 font-semibold text-ink">Restricted / closed</p>
          <p className="mt-1 text-xs text-slate-600">Structured sections + GRE summary PDF (no full PDF on map)</p>
        </button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Input
          label="External publication URL"
          type="url"
          value={gre.external_url || ""}
          onChange={(e) => onChange({ ...gre, external_url: e.target.value })}
          placeholder="https://journal.example.org/article/..."
          disabled={disabled}
        />
        <Input
          label="Reference / source URL"
          type="url"
          value={gre.reference_url || ""}
          onChange={(e) => onChange({ ...gre, reference_url: e.target.value })}
          placeholder="https://doi.org/..."
          disabled={disabled}
        />
      </div>

      {gre.access_type === "closed" && (
        <div className="mt-4">
          <Textarea
            label="Author summary (for GRE summary PDF)"
            value={gre.author_summary || ""}
            onChange={(e) => onChange({ ...gre, author_summary: e.target.value })}
            rows={4}
            placeholder="Plain-language summary readers can download when the full paper is restricted."
            disabled={disabled}
          />
        </div>
      )}

      {gre.gre_doi && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-200">
          <ExternalLink className="h-3.5 w-3.5 text-brand-600" />
          GRE DOI: <strong className="text-brand-700">{gre.gre_doi}</strong>
        </p>
      )}
    </section>
  );
}
