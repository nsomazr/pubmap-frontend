import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";
import { ManuscriptRichTextField } from "./ManuscriptRichTextField";
import { Input } from "../ui/Input";

export type ManuscriptFields = {
  abstract: string;
  introduction: string;
  methods: string;
  results: string;
  findings: string;
  conclusion: string;
  funder: string;
  references: string;
  keywords: string;
};

interface Props {
  title: string;
  onTitleChange: (value: string) => void;
  fields: ManuscriptFields;
  onChange: (key: keyof ManuscriptFields, value: string) => void;
  sectionNotes?: Partial<Record<"title" | keyof ManuscriptFields, string>>;
}

function ManuscriptGroup({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="gre-manuscript-group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <header className="border-b border-slate-100 bg-gradient-to-r from-slate-50/90 to-brand-50/20 px-5 py-4 sm:px-6">
        <h3 className="text-sm font-bold text-ink">{title}</h3>
        {description ? <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p> : null}
      </header>
      <div className="space-y-6 px-5 py-5 sm:px-6 sm:py-6">{children}</div>
    </section>
  );
}

function FieldExtractionNote({ note }: { note?: string }) {
  if (!note) return null;
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2.5 text-sm text-amber-900">
      <div className="flex gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <span>{note}</span>
      </div>
    </div>
  );
}

export function ManuscriptSectionsEditor({
  title,
  onTitleChange,
  fields,
  onChange,
  sectionNotes = {},
}: Props) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-brand-100/80 bg-gradient-to-br from-brand-50/50 via-white to-teal-50/30 px-4 py-3.5 text-sm leading-relaxed text-slate-600 sm:px-5">
        <p>
          <strong className="font-semibold text-brand-800">Results</strong> should list factual outcomes.{" "}
          <strong className="font-semibold text-brand-800">Findings — discussion</strong> holds interpretation.
          Review each section carefully before submitting.
        </p>
      </div>

      <ManuscriptGroup
        title="Summary"
        description="What readers see first in search and on the publication page."
      >
        <Input
          label="Title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          required
        />
        <FieldExtractionNote note={sectionNotes.title} />
        <ManuscriptRichTextField
          label="Abstract"
          value={fields.abstract}
          onChange={(v) => onChange("abstract", v)}
          minHeight={160}
          required
          hint="Plain-language overview of the study."
        />
        <FieldExtractionNote note={sectionNotes.abstract} />
        <Input
          label="Keywords"
          value={fields.keywords}
          onChange={(e) => onChange("keywords", e.target.value)}
          placeholder="climate, remote sensing, East Africa (comma-separated)"
        />
        <FieldExtractionNote note={sectionNotes.keywords} />
      </ManuscriptGroup>

      <ManuscriptGroup title="Background" description="Context, objectives, and study motivation.">
        <ManuscriptRichTextField
          label="Introduction"
          value={fields.introduction}
          onChange={(v) => onChange("introduction", v)}
          placeholder="Set the research context and objectives…"
        />
        <FieldExtractionNote note={sectionNotes.introduction} />
      </ManuscriptGroup>

      <ManuscriptGroup
        title="Methods & results"
        description="How the work was done and what was observed."
      >
        <ManuscriptRichTextField
          label="Methods"
          value={fields.methods}
          onChange={(v) => onChange("methods", v)}
          placeholder="Design, data collection, and analysis…"
        />
        <FieldExtractionNote note={sectionNotes.methods} />
        <ManuscriptRichTextField
          label="Results"
          value={fields.results}
          onChange={(v) => onChange("results", v)}
          placeholder="Key outcomes, measurements, and observations…"
        />
        <FieldExtractionNote note={sectionNotes.results} />
      </ManuscriptGroup>

      <ManuscriptGroup title="Discussion & closing" description="Interpretation and takeaways.">
        <ManuscriptRichTextField
          label="Findings — discussion"
          value={fields.findings}
          onChange={(v) => onChange("findings", v)}
          placeholder="Interpret results and relate them to the literature…"
        />
        <FieldExtractionNote note={sectionNotes.findings} />
        <ManuscriptRichTextField
          label="Conclusion"
          value={fields.conclusion}
          onChange={(v) => onChange("conclusion", v)}
          placeholder="Summarise implications and future work…"
        />
        <FieldExtractionNote note={sectionNotes.conclusion} />
      </ManuscriptGroup>

      <ManuscriptGroup title="Funding & references" description="Acknowledgements and citations.">
        <Input
          label="Funder — acknowledgements"
          value={fields.funder}
          onChange={(e) => onChange("funder", e.target.value)}
          placeholder="Grant numbers, institutions, or partners"
        />
        <FieldExtractionNote note={sectionNotes.funder} />
        <ManuscriptRichTextField
          label="References"
          value={fields.references}
          onChange={(v) => onChange("references", v)}
          minHeight={140}
          placeholder="List references or paste a bibliography…"
        />
        <FieldExtractionNote note={sectionNotes.references} />
      </ManuscriptGroup>
    </div>
  );
}
