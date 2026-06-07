import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";
import { RichTextEditor } from "../editor/RichTextEditor";
import { Input } from "../ui/Input";
import {
  MANUSCRIPT_FIELD_WORD_LIMITS,
  MANUSCRIPT_FINDINGS_GROUP_TITLE,
  narrativeWordMaximum,
  normalizeFunderField,
  truncateToWordLimit,
} from "../../lib/manuscriptFieldLimits";
import { greFormSectionClass, greFormSectionTitleClass } from "../../lib/formStyles";
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
  /** Rendered after Methods, before Findings & Conclusion. */
  afterMethods?: ReactNode;
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
    <section className={`gre-manuscript-group ${greFormSectionClass}`}>
      <h3 className={greFormSectionTitleClass}>{title}</h3>
      {description ? (
        <p className="-mt-2 mb-4 text-xs leading-relaxed text-slate-500">{description}</p>
      ) : null}
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function FieldExtractionNote({ note }: { note?: string }) {
  if (!note) return null;
  return (
    <div className="rounded-lg border border-amber-200/90 bg-amber-50/70 px-3 py-2.5 text-sm text-amber-900">
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
  afterMethods,
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
          narrativeField="abstract"
          maxWords={narrativeWordMaximum("abstract")}
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
          required={narrativeRequired}
          narrativeField="introduction"
          maxWords={narrativeWordMaximum("introduction")}
        />
        <FieldExtractionNote note={sectionNotes.introduction} />
      </ManuscriptGroup>

      <ManuscriptGroup title="Methods">
        <RichTextEditor
          label="Methods"
          value={fields.methods}
          onChange={(v) => onChange("methods", v)}
          required={narrativeRequired}
          narrativeField="methods"
          maxWords={narrativeWordMaximum("methods")}
        />
        <FieldExtractionNote note={sectionNotes.methods} />
      </ManuscriptGroup>

      {afterMethods}

      <ManuscriptGroup title={MANUSCRIPT_FINDINGS_GROUP_TITLE}>
        <RichTextEditor
          label="Findings"
          value={fields.findings}
          onChange={(v) => onChange("findings", v)}
          required={narrativeRequired}
          narrativeField="findings"
          maxWords={narrativeWordMaximum("findings")}
        />
        <FieldExtractionNote note={sectionNotes.findings} />
        <RichTextEditor
          label="Conclusion"
          value={fields.conclusion}
          onChange={(v) => onChange("conclusion", v)}
          narrativeField="conclusion"
          maxWords={narrativeWordMaximum("conclusion")}
        />
        <FieldExtractionNote note={sectionNotes.conclusion} />
      </ManuscriptGroup>

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
