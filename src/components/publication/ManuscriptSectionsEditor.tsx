import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";
import { RichTextEditor } from "../editor/RichTextEditor";
import { Input } from "../ui/Input";
import {
  MANUSCRIPT_FIELD_WORD_LIMITS,
  MANUSCRIPT_FINDINGS_GROUP_TITLE,
  normalizeFunderField,
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
  /** Restricted access: introduction, methods, and findings are required for submit. */
  requireNarrativeSections?: boolean;
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
  requireNarrativeSections = false,
  afterFindings,
}: Props) {
  const narrativeRequired = requireNarrativeSections;
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
        />
        <FieldExtractionNote note={sectionNotes.title} />
        <RichTextEditor
          label="Abstract"
          value={fields.abstract}
          onChange={(v) => onChange("abstract", v)}
          minHeight={160}
          required
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
          placeholder="climate, remote sensing, East Africa"
        />
        <FieldExtractionNote note={sectionNotes.keywords} />
      </ManuscriptGroup>

      <ManuscriptGroup title="Background">
        <RichTextEditor
          label="Introduction"
          value={fields.introduction}
          onChange={(v) => onChange("introduction", v)}
          maxWords={MANUSCRIPT_FIELD_WORD_LIMITS.introduction}
          required={narrativeRequired}
        />
        <FieldExtractionNote note={sectionNotes.introduction} />
      </ManuscriptGroup>

      <ManuscriptGroup title="Methods">
        <RichTextEditor
          label="Methods"
          value={fields.methods}
          onChange={(v) => onChange("methods", v)}
          maxWords={MANUSCRIPT_FIELD_WORD_LIMITS.methods}
          required={narrativeRequired}
        />
        <FieldExtractionNote note={sectionNotes.methods} />
      </ManuscriptGroup>

      <ManuscriptGroup title={MANUSCRIPT_FINDINGS_GROUP_TITLE}>
        <RichTextEditor
          label="Findings"
          value={fields.findings}
          onChange={(v) => onChange("findings", v)}
          maxWords={MANUSCRIPT_FIELD_WORD_LIMITS.findings}
          required={narrativeRequired}
        />
        <FieldExtractionNote note={sectionNotes.findings} />
        <RichTextEditor
          label="Conclusion"
          value={fields.conclusion}
          onChange={(v) => onChange("conclusion", v)}
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
          placeholder="e.g. NSF, Sida (comma-separated organizations; leave blank if none)"
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
