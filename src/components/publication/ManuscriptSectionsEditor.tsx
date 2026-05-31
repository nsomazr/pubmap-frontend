import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";
import { RichTextEditor } from "../editor/RichTextEditor";
import { Input } from "../ui/Input";
import {
  MANUSCRIPT_FIELD_WORD_LIMITS,
  MANUSCRIPT_FINDINGS_GROUP_DESCRIPTION,
  MANUSCRIPT_FINDINGS_GROUP_TITLE,
  normalizeFunderField,
  formatWordLimitHint,
  truncateToWordLimit,
} from "../../lib/manuscriptFieldLimits";
import { ReferencesFromResearch } from "./ReferencesFromResearch";

export type ManuscriptFields = {
  abstract: string;
  introduction: string;
  methods: string;
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
  /** Rendered after Findings & Conclusion, before Funding & references. */
  afterFindings?: ReactNode;
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
  afterFindings,
}: Props) {
  return (
    <div className="space-y-6">
      <ManuscriptGroup title="Summary">
        <Input
          label="Title"
          value={title}
          onChange={(e) =>
            onTitleChange(
              truncateToWordLimit(e.target.value, MANUSCRIPT_FIELD_WORD_LIMITS.title)
            )
          }
          required
          hint={formatWordLimitHint("title")}
        />
        <FieldExtractionNote note={sectionNotes.title} />
        <RichTextEditor
          label="Abstract"
          value={fields.abstract}
          onChange={(v) => onChange("abstract", v)}
          minHeight={160}
          required
          hint="Plain-language overview of the study."
          maxWords={MANUSCRIPT_FIELD_WORD_LIMITS.abstract}
        />
        <FieldExtractionNote note={sectionNotes.abstract} />
        <Input
          label="Keywords"
          value={fields.keywords}
          onChange={(e) =>
            onChange(
              "keywords",
              truncateToWordLimit(e.target.value, MANUSCRIPT_FIELD_WORD_LIMITS.keywords)
            )
          }
          placeholder="climate, remote sensing, East Africa (comma-separated)"
          hint={formatWordLimitHint("keywords")}
        />
        <FieldExtractionNote note={sectionNotes.keywords} />
      </ManuscriptGroup>

      <ManuscriptGroup title="Background">
        <RichTextEditor
          label="Introduction"
          value={fields.introduction}
          onChange={(v) => onChange("introduction", v)}
          placeholder="Set the research context and objectives…"
          maxWords={MANUSCRIPT_FIELD_WORD_LIMITS.introduction}
        />
        <FieldExtractionNote note={sectionNotes.introduction} />
      </ManuscriptGroup>

      <ManuscriptGroup title="Methods">
        <RichTextEditor
          label="Methods"
          value={fields.methods}
          onChange={(v) => onChange("methods", v)}
          placeholder="Design, data collection, and analysis…"
          maxWords={MANUSCRIPT_FIELD_WORD_LIMITS.methods}
        />
        <FieldExtractionNote note={sectionNotes.methods} />
      </ManuscriptGroup>

      <ManuscriptGroup
        title={MANUSCRIPT_FINDINGS_GROUP_TITLE}
        description={MANUSCRIPT_FINDINGS_GROUP_DESCRIPTION}
      >
        <RichTextEditor
          label="Findings"
          value={fields.findings}
          onChange={(v) => onChange("findings", v)}
          placeholder="Results, interpretation, and discussion from your paper…"
          maxWords={MANUSCRIPT_FIELD_WORD_LIMITS.findings}
        />
        <FieldExtractionNote note={sectionNotes.findings} />
        <RichTextEditor
          label="Conclusion"
          value={fields.conclusion}
          onChange={(v) => onChange("conclusion", v)}
          placeholder="Closing synthesis, implications, and future work…"
          maxWords={MANUSCRIPT_FIELD_WORD_LIMITS.conclusion}
        />
        <FieldExtractionNote note={sectionNotes.conclusion} />
      </ManuscriptGroup>

      {afterFindings}

      <ManuscriptGroup title="Funding & references">
        <Input
          label="Funders"
          value={fields.funder}
          onChange={(e) =>
            onChange(
              "funder",
              truncateToWordLimit(
                normalizeFunderField(e.target.value),
                MANUSCRIPT_FIELD_WORD_LIMITS.funder
              )
            )
          }
          placeholder="NSF, University of Dar es Salaam"
          hint="Organization names only, comma-separated"
        />
        <FieldExtractionNote note={sectionNotes.funder} />
        <ReferencesFromResearch
          value={fields.references}
          paperTitle={title}
          onChange={(v) => onChange("references", v)}
        />
        <FieldExtractionNote note={sectionNotes.references} />
      </ManuscriptGroup>
    </div>
  );
}
